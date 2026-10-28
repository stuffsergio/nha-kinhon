import prisma from "../config/db.js";
import env from "../config/env.js";
import { walletConfig } from "../config/wallet.js";
import { codedError } from "../utils/errors.js";
import { getStripe, isStripeConfigured } from "./stripe.service.js";
import { assertWalletOperableUser, getOrCreateWallet } from "./wallet.service.js";
import { lockWalletRow, sumLedgerBalancesTx } from "../utils/walletLock.js";
import { createNotification } from "./notification.service.js";

export async function createWalletDepositIntent({ userId, amountMinor, idempotencyKey }) {
  await assertWalletOperableUser(userId);
  if (!isStripeConfigured()) {
    throw codedError("STRIPE_NOT_CONFIGURED", 503);
  }

  if (idempotencyKey) {
    const existing = await prisma.walletTransaction.findUnique({ where: { idempotencyKey } });
    if (existing?.stripePaymentIntentId) {
      const pi = await getStripe().paymentIntents.retrieve(existing.stripePaymentIntentId);
      return buildDepositClientPayload(existing, pi.client_secret);
    }
  }

  const wallet = await getOrCreateWallet(userId);
  const user = await prisma.user.findUnique({ where: { id: userId } });

  let customerId = user.stripeCustomerId;
  if (!customerId) {
    const customer = await getStripe().customers.create({ metadata: { userId } });
    customerId = customer.id;
    await prisma.user.update({
      where: { id: userId },
      data: { stripeCustomerId: customerId },
    });
  }

  const walletTx = await prisma.walletTransaction.create({
    data: {
      walletId: wallet.id,
      type: "DEPOSIT",
      status: "PENDING",
      amountMinor,
      idempotencyKey,
    },
  });

  const paymentIntent = await getStripe().paymentIntents.create(
    {
      amount: amountMinor,
      currency: "xof",
      customer: customerId,
      automatic_payment_methods: { enabled: true },
      metadata: {
        type: "wallet_deposit",
        walletTransactionId: walletTx.id,
        userId,
        walletId: wallet.id,
      },
    },
    { idempotencyKey: idempotencyKey ? `wallet-dep-${idempotencyKey}` : undefined },
  );

  await prisma.walletTransaction.update({
    where: { id: walletTx.id },
    data: { stripePaymentIntentId: paymentIntent.id },
  });

  const ephemeralKey = await getStripe().ephemeralKeys.create(
    { customer: customerId },
    { apiVersion: "2025-02-24.acacia" },
  );

  return {
    walletTransactionId: walletTx.id,
    amountMinor,
    currency: walletConfig.currency,
    paymentIntent: paymentIntent.client_secret,
    ephemeralKey: ephemeralKey.secret,
    customer: customerId,
    publishableKey: env.STRIPE_PUBLISHABLE_KEY,
  };
}

function buildDepositClientPayload(walletTx, clientSecret) {
  return {
    walletTransactionId: walletTx.id,
    amountMinor: walletTx.amountMinor,
    currency: walletConfig.currency,
    paymentIntent: clientSecret,
    replay: true,
  };
}

/**
 * Called only from verified Stripe webhook (payment_intent.succeeded).
 */
export async function finalizeWalletDepositFromStripe(paymentIntent) {
  if (paymentIntent.metadata?.type !== "wallet_deposit") {
    return null;
  }

  const walletTransactionId = paymentIntent.metadata.walletTransactionId;
  const userId = paymentIntent.metadata.userId;
  if (!walletTransactionId || !userId) {
    console.error("[WALLET] wallet_deposit PI missing metadata");
    return null;
  }

  const expectedAmount = paymentIntent.amount_received ?? paymentIntent.amount;
  const ledgerKey = `stripe-pi-${paymentIntent.id}`;

  return prisma.$transaction(async (tx) => {
    const existingLedger = await tx.ledgerEntry.findUnique({ where: { idempotencyKey: ledgerKey } });
    if (existingLedger) {
      return { idempotent: true };
    }

    const walletTx = await tx.walletTransaction.findUnique({ where: { id: walletTransactionId } });
    if (!walletTx) {
      console.error("[WALLET] Unknown wallet transaction", walletTransactionId);
      return null;
    }
    if (walletTx.status === "COMPLETED") {
      return { idempotent: true };
    }
    if (expectedAmount !== walletTx.amountMinor) {
      console.error("[WALLET] Stripe amount mismatch", walletTransactionId);
      throw codedError("STRIPE_AMOUNT_MISMATCH", 400);
    }

    const wallet = await tx.wallet.findUnique({ where: { id: walletTx.walletId } });
    await lockWalletRow(tx, wallet.id);

    await tx.walletTransaction.update({
      where: { id: walletTx.id },
      data: { status: "COMPLETED", stripePaymentIntentId: paymentIntent.id },
    });

    await tx.ledgerEntry.create({
      data: {
        walletId: wallet.id,
        side: "CREDIT",
        amountMinor: walletTx.amountMinor,
        entryType: "DEPOSIT",
        status: "POSTED",
        walletTransactionId: walletTx.id,
        idempotencyKey: ledgerKey,
        reference: paymentIntent.id,
      },
    });

    await createNotification({
      userId,
      type: "WALLET_DEPOSIT_RECEIVED",
      template: "WALLET_DEPOSIT_RECEIVED",
      templateParams: { amount: String(walletTx.amountMinor) },
    });

    const balances = await sumLedgerBalancesTx(tx, wallet.id);
    await tx.user.update({
      where: { id: userId },
      data: { balance: balances.balanceMinor },
    });

    return { idempotent: false, walletTransactionId: walletTx.id };
  });
}
