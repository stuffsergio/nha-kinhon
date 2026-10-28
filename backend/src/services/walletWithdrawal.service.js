import prisma from "../config/db.js";
import { codedError } from "../utils/errors.js";
import {
  assertSufficientAvailable,
  lockWalletRow,
  sumLedgerBalancesTx,
} from "../utils/walletLock.js";
import { assertWalletOperableUser, getOrCreateWallet } from "./wallet.service.js";
import { createNotification } from "./notification.service.js";
import { logAdminAction } from "./adminAudit.service.js";
import { getPayoutProvider } from "./walletPayout.provider.js";

export async function createWithdrawalRequest({
  userId,
  amountMinor,
  method,
  destination,
  idempotencyKey,
}) {
  await assertWalletOperableUser(userId);

  return prisma.$transaction(async (tx) => {
    if (idempotencyKey) {
      const existing = await tx.walletTransaction.findUnique({ where: { idempotencyKey } });
      if (existing) {
        const wr = await tx.withdrawalRequest.findUnique({
          where: { walletTransactionId: existing.id },
        });
        return { withdrawalRequest: wr, walletTransaction: existing, idempotent: true };
      }
    }

    const wallet = await getOrCreateWallet(userId, tx);
    await lockWalletRow(tx, wallet.id);
    const balances = await sumLedgerBalancesTx(tx, wallet.id);
    assertSufficientAvailable(balances.availableMinor, amountMinor);

    const walletTx = await tx.walletTransaction.create({
      data: {
        walletId: wallet.id,
        type: "WITHDRAWAL",
        status: "PENDING",
        amountMinor,
        idempotencyKey,
        metadata: { method },
      },
    });

    await tx.ledgerEntry.create({
      data: {
        walletId: wallet.id,
        side: "DEBIT",
        amountMinor,
        entryType: "WITHDRAWAL",
        status: "PENDING",
        walletTransactionId: walletTx.id,
        idempotencyKey: idempotencyKey ? `withdraw-hold-${idempotencyKey}` : undefined,
      },
    });

    const withdrawalRequest = await tx.withdrawalRequest.create({
      data: {
        walletTransactionId: walletTx.id,
        userId,
        amountMinor,
        method,
        destination,
        status: "PENDING",
      },
    });

    return { withdrawalRequest, walletTransaction: walletTx, idempotent: false };
  });
}

export async function listWithdrawalsForAdmin({ status, cursor, limit = 30 }) {
  const take = Math.min(Math.max(limit, 1), 100);
  const where = status ? { status } : {};
  const items = await prisma.withdrawalRequest.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: take + 1,
    include: {
      walletTransaction: { include: { wallet: { include: { user: { select: { id: true, name: true, email: true } } } } } },
    },
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
  });
  const hasMore = items.length > take;
  const page = hasMore ? items.slice(0, take) : items;
  return { withdrawals: page, nextCursor: hasMore ? page[page.length - 1].id : null };
}

export async function approveWithdrawal({ withdrawalId, adminId, adminNote }) {
  return reviewWithdrawal({ withdrawalId, adminId, adminNote, decision: "APPROVED" });
}

export async function rejectWithdrawal({ withdrawalId, adminId, adminNote }) {
  return reviewWithdrawal({ withdrawalId, adminId, adminNote, decision: "REJECTED" });
}

async function reviewWithdrawal({ withdrawalId, adminId, adminNote, decision }) {
  return prisma.$transaction(async (tx) => {
    const wr = await tx.withdrawalRequest.findUnique({
      where: { id: withdrawalId },
      include: { walletTransaction: true },
    });
    if (!wr) throw codedError("NOT_FOUND", 404);
    if (wr.status !== "PENDING") throw codedError("WALLET_WITHDRAWAL_ALREADY_REVIEWED", 409);

    const walletTx = wr.walletTransaction;
    await lockWalletRow(tx, walletTx.walletId);

    if (decision === "APPROVED") {
      await tx.withdrawalRequest.update({
        where: { id: withdrawalId },
        data: {
          status: "APPROVED",
          reviewedById: adminId,
          reviewedAt: new Date(),
          adminNote: adminNote ?? null,
        },
      });
      await tx.walletTransaction.update({
        where: { id: walletTx.id },
        data: { status: "PENDING" },
      });
    } else {
      await tx.ledgerEntry.updateMany({
        where: { walletTransactionId: walletTx.id, status: "PENDING" },
        data: { status: "REVERSED" },
      });
      await tx.walletTransaction.update({
        where: { id: walletTx.id },
        data: { status: "CANCELLED" },
      });
      await tx.withdrawalRequest.update({
        where: { id: withdrawalId },
        data: {
          status: "REJECTED",
          reviewedById: adminId,
          reviewedAt: new Date(),
          adminNote: adminNote ?? null,
        },
      });
    }

    await logAdminAction({
      adminId,
      action: decision === "APPROVED" ? "WALLET_WITHDRAWAL_APPROVE" : "WALLET_WITHDRAWAL_REJECT",
      metadata: { withdrawalId, amountMinor: wr.amountMinor },
    });

    const template =
      decision === "APPROVED" ? "WALLET_WITHDRAWAL_APPROVED" : "WALLET_WITHDRAWAL_REJECTED";
    const type =
      decision === "APPROVED" ? "WALLET_WITHDRAWAL_APPROVED" : "WALLET_WITHDRAWAL_REJECTED";

    await createNotification({
      userId: wr.userId,
      type,
      template,
      templateParams: { amount: String(wr.amountMinor) },
    });

    return tx.withdrawalRequest.findUnique({ where: { id: withdrawalId } });
  });
}

export async function markWithdrawalPaid({ withdrawalId, adminId, payoutReference }) {
  return prisma.$transaction(async (tx) => {
    const wr = await tx.withdrawalRequest.findUnique({
      where: { id: withdrawalId },
      include: { walletTransaction: true },
    });
    if (!wr) throw codedError("NOT_FOUND", 404);
    if (wr.status !== "APPROVED") throw codedError("WALLET_WITHDRAWAL_NOT_APPROVED", 409);

    const walletTx = wr.walletTransaction;
    await lockWalletRow(tx, walletTx.walletId);

    await tx.ledgerEntry.updateMany({
      where: { walletTransactionId: walletTx.id, status: "PENDING" },
      data: { status: "POSTED" },
    });

    await tx.walletTransaction.update({
      where: { id: walletTx.id },
      data: { status: "COMPLETED" },
    });

    const payoutRef =
      payoutReference ||
      (await getPayoutProvider().recordManualPayout({
        withdrawalRequest: wr,
        adminId,
      }));

    const updated = await tx.withdrawalRequest.update({
      where: { id: withdrawalId },
      data: {
        status: "PAID",
        paidAt: new Date(),
        payoutReference: payoutRef,
      },
    });

    await logAdminAction({
      adminId,
      action: "WALLET_WITHDRAWAL_PAID",
      metadata: { withdrawalId, payoutReference: payoutRef },
    });

    await createNotification({
      userId: wr.userId,
      type: "WALLET_WITHDRAWAL_PAID",
      template: "WALLET_WITHDRAWAL_PAID",
      templateParams: { amount: String(wr.amountMinor) },
    });

    return updated;
  });
}
