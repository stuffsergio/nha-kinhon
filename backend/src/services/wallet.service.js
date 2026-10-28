import prisma from "../config/db.js";
import { walletConfig } from "../config/wallet.js";
import { codedError } from "../utils/errors.js";
import {
  assertSufficientAvailable,
  lockWalletPair,
  lockWalletRow,
  sumLedgerBalancesTx,
} from "../utils/walletLock.js";
import { createNotification } from "./notification.service.js";
import { finalizeOrderAsPaid } from "./orderConfirm.service.js";
import { isUnpaidOrderStatus } from "../utils/orderPayment.js";
import { logAdminAction } from "./adminAudit.service.js";

export async function getOrCreateWallet(userId, tx = prisma) {
  let wallet = await tx.wallet.findUnique({ where: { userId } });
  if (wallet) return wallet;
  try {
    wallet = await tx.wallet.create({
      data: { userId, currency: walletConfig.currency },
    });
  } catch (err) {
    if (err.code === "P2002") {
      wallet = await tx.wallet.findUnique({ where: { userId } });
    } else {
      throw err;
    }
  }
  return wallet;
}

export async function assertWalletOperableUser(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, deletedAt: true, isBlocked: true },
  });
  if (!user) throw codedError("NOT_FOUND", 404);
  if (user.deletedAt) throw codedError("ACCOUNT_DELETED", 403);
  if (user.isBlocked) throw codedError("ACCOUNT_BLOCKED", 403);
  return user;
}

export async function getWalletSummaryForUser(userId) {
  await assertWalletOperableUser(userId);
  const wallet = await getOrCreateWallet(userId);
  const balances = await sumLedgerBalancesTx(prisma, wallet.id);
  return {
    walletId: wallet.id,
    currency: wallet.currency,
    balanceMinor: balances.balanceMinor,
    availableMinor: balances.availableMinor,
    pendingHoldMinor: balances.pendingHoldMinor,
    limits: {
      deposit: { minMinor: walletConfig.depositMinMinor, maxMinor: walletConfig.depositMaxMinor },
      transfer: {
        minMinor: walletConfig.transferMinMinor,
        maxMinor: walletConfig.transferMaxMinor,
        dailyLimitMinor: walletConfig.transferDailyLimitMinor,
      },
      withdrawal: {
        minMinor: walletConfig.withdrawalMinMinor,
        maxMinor: walletConfig.withdrawalMaxMinor,
      },
    },
  };
}

export async function listWalletTransactions(userId, { cursor, limit = 20, type, status }) {
  const wallet = await getOrCreateWallet(userId);
  const take = Math.min(Math.max(limit, 1), 50);
  const where = { walletId: wallet.id };
  if (type) where.type = type;
  if (status) where.status = status;

  const items = await prisma.walletTransaction.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: take + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
  });

  const hasMore = items.length > take;
  const page = hasMore ? items.slice(0, take) : items;
  return {
    transactions: page,
    nextCursor: hasMore ? page[page.length - 1].id : null,
  };
}

async function sumTransferOutTodayTx(tx, walletId) {
  const start = new Date();
  start.setUTCHours(0, 0, 0, 0);
  const agg = await tx.walletTransaction.aggregate({
    where: {
      walletId,
      type: "TRANSFER_OUT",
      status: "COMPLETED",
      createdAt: { gte: start },
    },
    _sum: { amountMinor: true },
  });
  return agg._sum.amountMinor || 0;
}

export async function transferBetweenUsers({
  senderUserId,
  recipientLookup,
  amountMinor,
  note,
  idempotencyKey,
}) {
  await assertWalletOperableUser(senderUserId);

  const recipient = await resolveRecipientForTransfer(recipientLookup, senderUserId);

  return prisma.$transaction(async (tx) => {
    const existingTx = idempotencyKey
      ? await tx.walletTransaction.findUnique({ where: { idempotencyKey } })
      : null;
    if (existingTx) {
      return formatTransferResponse(existingTx, recipient);
    }

    const senderWallet = await getOrCreateWallet(senderUserId, tx);
    const recipientWallet = await getOrCreateWallet(recipient.id, tx);

    await lockWalletPair(tx, senderWallet.id, recipientWallet.id);

    const dailyOut = await sumTransferOutTodayTx(tx, senderWallet.id);
    if (dailyOut + amountMinor > walletConfig.transferDailyLimitMinor) {
      throw codedError("WALLET_TRANSFER_DAILY_LIMIT", 429);
    }

    const senderBalances = await sumLedgerBalancesTx(tx, senderWallet.id);
    assertSufficientAvailable(senderBalances.availableMinor, amountMinor);

    const outTx = await tx.walletTransaction.create({
      data: {
        walletId: senderWallet.id,
        type: "TRANSFER_OUT",
        status: "COMPLETED",
        amountMinor,
        counterpartyWalletId: recipientWallet.id,
        note: note ?? null,
        idempotencyKey,
      },
    });

    const inTx = await tx.walletTransaction.create({
      data: {
        walletId: recipientWallet.id,
        type: "TRANSFER_IN",
        status: "COMPLETED",
        amountMinor,
        counterpartyWalletId: senderWallet.id,
        note: note ?? null,
        idempotencyKey: idempotencyKey ? `${idempotencyKey}-in` : null,
      },
    });

    await tx.ledgerEntry.createMany({
      data: [
        {
          walletId: senderWallet.id,
          side: "DEBIT",
          amountMinor,
          entryType: "TRANSFER_OUT",
          status: "POSTED",
          walletTransactionId: outTx.id,
          idempotencyKey: idempotencyKey ? `transfer-out-${idempotencyKey}` : undefined,
        },
        {
          walletId: recipientWallet.id,
          side: "CREDIT",
          amountMinor,
          entryType: "TRANSFER_IN",
          status: "POSTED",
          walletTransactionId: inTx.id,
          idempotencyKey: idempotencyKey ? `transfer-in-${idempotencyKey}` : undefined,
        },
      ],
    });

    await createNotification({
      userId: senderUserId,
      type: "WALLET_TRANSFER_SENT",
      template: "WALLET_TRANSFER_SENT",
      templateParams: { amount: String(amountMinor), maskedName: recipient.maskedName },
    });

    await createNotification({
      userId: recipient.id,
      type: "WALLET_TRANSFER_RECEIVED",
      template: "WALLET_TRANSFER_RECEIVED",
      templateParams: { amount: String(amountMinor) },
    });

    return formatTransferResponse(outTx, recipient);
  });
}

function formatTransferResponse(outTx, recipient) {
  return {
    transaction: outTx,
    recipient: { id: recipient.id, maskedName: recipient.maskedName },
  };
}

export async function lookupTransferRecipient(query, actorUserId) {
  const normalized = String(query || "").trim().toLowerCase();
  if (normalized.length < 3) {
    throw codedError("WALLET_RECIPIENT_QUERY_SHORT", 400);
  }

  const isEmail = normalized.includes("@");
  let user;
  if (isEmail) {
    user = await prisma.user.findFirst({
      where: {
        email: normalized,
        deletedAt: null,
        isBlocked: false,
        NOT: { id: actorUserId },
      },
      select: { id: true, name: true },
    });
  } else {
    const phoneDigits = normalized.replace(/\D/g, "");
    if (phoneDigits.length < 7) {
      throw codedError("WALLET_RECIPIENT_QUERY_SHORT", 400);
    }
    user = await prisma.user.findFirst({
      where: {
        phone: { contains: phoneDigits.slice(-8) },
        deletedAt: null,
        isBlocked: false,
        NOT: { id: actorUserId },
      },
      select: { id: true, name: true },
    });
  }

  if (!user) {
    return { found: false };
  }

  return { found: true, maskedName: maskDisplayName(user.name) };
}

function maskDisplayName(name) {
  const parts = String(name || "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "•••";
  const first = parts[0];
  if (first.length <= 1) return `${first}•`;
  return `${first[0]}${"•".repeat(Math.min(first.length - 1, 4))}`;
}

async function resolveRecipientForTransfer(recipientLookup, senderUserId) {
  const normalized = String(recipientLookup || "").trim().toLowerCase();
  const isEmail = normalized.includes("@");
  let user;
  if (isEmail) {
    user = await prisma.user.findFirst({
      where: { email: normalized, deletedAt: null, isBlocked: false },
      select: { id: true, name: true },
    });
  } else {
    const phoneDigits = normalized.replace(/\D/g, "");
    user = await prisma.user.findFirst({
      where: {
        OR: [
          { phone: normalized },
          { phone: { contains: phoneDigits } },
        ],
        deletedAt: null,
        isBlocked: false,
      },
      select: { id: true, name: true },
    });
  }

  if (!user) throw codedError("WALLET_RECIPIENT_NOT_FOUND", 404);
  if (user.id === senderUserId) throw codedError("WALLET_TRANSFER_SELF", 400);
  return { ...user, maskedName: maskDisplayName(user.name) };
}

export async function payOrderWithWallet({ userId, orderId, idempotencyKey }) {
  await assertWalletOperableUser(userId);

  return prisma.$transaction(async (tx) => {
    if (idempotencyKey) {
      const existing = await tx.walletTransaction.findUnique({ where: { idempotencyKey } });
      if (existing?.orderId === orderId && existing.status === "COMPLETED") {
        const order = await tx.order.findUnique({ where: { id: orderId } });
        return { order, walletTransaction: existing, idempotent: true };
      }
    }

    const order = await tx.order.findUnique({ where: { id: orderId } });
    if (!order) throw codedError("NOT_FOUND", 404);
    if (order.userId !== userId) throw codedError("ORDER_FORBIDDEN", 403);
    if (!isUnpaidOrderStatus(order.status)) {
      if (order.status === "CONFIRMED") {
        return { order, walletTransaction: null, idempotent: true };
      }
      throw codedError("ORDER_NOT_PENDING_PAYMENT", 400);
    }

    const amountMinor = Math.round(order.total);
    const wallet = await getOrCreateWallet(userId, tx);
    await lockWalletRow(tx, wallet.id);
    const balances = await sumLedgerBalancesTx(tx, wallet.id);
    assertSufficientAvailable(balances.availableMinor, amountMinor);

    const walletTx = await tx.walletTransaction.create({
      data: {
        walletId: wallet.id,
        type: "ORDER_PAYMENT",
        status: "COMPLETED",
        amountMinor,
        orderId,
        idempotencyKey,
      },
    });

    await tx.ledgerEntry.create({
      data: {
        walletId: wallet.id,
        side: "DEBIT",
        amountMinor,
        entryType: "ORDER_PAYMENT",
        status: "POSTED",
        walletTransactionId: walletTx.id,
        reference: orderId,
        idempotencyKey: idempotencyKey ? `order-pay-${idempotencyKey}` : `order-pay-${walletTx.id}`,
      },
    });

    const updated = await finalizeOrderAsPaid({
      orderId,
      userId,
      stripePaymentId: `wallet:${walletTx.id}`,
    });

    return { order: updated, walletTransaction: walletTx, idempotent: false };
  });
}

export async function creditWalletRefund({
  userId,
  amountMinor,
  orderId,
  idempotencyKey,
  adminId,
}) {
  await assertWalletOperableUser(userId);

  return prisma.$transaction(async (tx) => {
    const ledgerKey = idempotencyKey || `wallet-refund-${orderId}-${amountMinor}`;
    const existingEntry = await tx.ledgerEntry.findUnique({ where: { idempotencyKey: ledgerKey } });
    if (existingEntry) {
      const wt = await tx.walletTransaction.findFirst({
        where: { id: existingEntry.walletTransactionId },
      });
      return { walletTransaction: wt, idempotent: true };
    }

    const wallet = await getOrCreateWallet(userId, tx);
    await lockWalletRow(tx, wallet.id);

    const walletTx = await tx.walletTransaction.create({
      data: {
        walletId: wallet.id,
        type: "REFUND",
        status: "COMPLETED",
        amountMinor,
        orderId,
        idempotencyKey: ledgerKey,
      },
    });

    await tx.ledgerEntry.create({
      data: {
        walletId: wallet.id,
        side: "CREDIT",
        amountMinor,
        entryType: "REFUND",
        status: "POSTED",
        walletTransactionId: walletTx.id,
        reference: orderId,
        idempotencyKey: ledgerKey,
      },
    });

    if (adminId) {
      await logAdminAction({
        adminId,
        action: "WALLET_REFUND_CREDIT",
        orderId,
        metadata: { amountMinor, walletTransactionId: walletTx.id },
      });
    }

    return { walletTransaction: walletTx, idempotent: false };
  });
}

export async function getWalletBalanceMinor(userId) {
  const wallet = await getOrCreateWallet(userId);
  const balances = await sumLedgerBalancesTx(prisma, wallet.id);
  return balances;
}
