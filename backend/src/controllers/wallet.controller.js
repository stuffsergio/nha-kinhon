import { walletConfig } from "../config/wallet.js";
import { parseAmountMinor, assertAmountInRange } from "../utils/walletAmount.js";
import { requireIdempotencyKey, withWalletIdempotency } from "../utils/walletIdempotency.js";
import {
  getWalletSummaryForUser,
  listWalletTransactions,
  lookupTransferRecipient,
  transferBetweenUsers,
  payOrderWithWallet,
} from "../services/wallet.service.js";
import { createWalletDepositIntent } from "../services/walletDeposit.service.js";
import {
  cancelWithdrawalByUser,
  createWithdrawalRequest,
  listWithdrawalsForUser,
} from "../services/walletWithdrawal.service.js";

function parseBodyAmount(body) {
  const amountMinor = parseAmountMinor(body.amount);
  return amountMinor;
}

export async function getWallet(req, res) {
  const summary = await getWalletSummaryForUser(req.user.id);
  res.json(summary);
}

export async function listWithdrawals(req, res) {
  const { cursor, limit, status } = req.query;
  const result = await listWithdrawalsForUser(req.user.id, {
    cursor,
    limit: limit ? parseInt(limit, 10) : undefined,
    status,
  });
  res.json(result);
}

export async function listTransactions(req, res) {
  const { cursor, limit, type, status } = req.query;
  const result = await listWalletTransactions(req.user.id, {
    cursor,
    limit: limit ? parseInt(limit, 10) : undefined,
    type,
    status,
  });
  res.json(result);
}

export async function lookupRecipient(req, res) {
  const q = req.query.q;
  const result = await lookupTransferRecipient(q, req.user.id);
  res.json(result);
}

export async function createDeposit(req, res) {
  const amountMinor = parseBodyAmount(req.body);
  assertAmountInRange(amountMinor, {
    min: walletConfig.depositMinMinor,
    max: walletConfig.depositMaxMinor,
  });

  const idempotencyKey = requireIdempotencyKey(req.headers["x-idempotency-key"]);

  const { body } = await withWalletIdempotency({
    scope: "wallet_deposit",
    key: idempotencyKey,
    actorId: req.user.id,
    run: async () => {
      const payload = await createWalletDepositIntent({
        userId: req.user.id,
        amountMinor,
        idempotencyKey,
      });
      return payload;
    },
  });

  res.status(201).json(body);
}

export async function createTransfer(req, res) {
  const amountMinor = parseBodyAmount(req.body);
  assertAmountInRange(amountMinor, {
    min: walletConfig.transferMinMinor,
    max: walletConfig.transferMaxMinor,
  });

  const idempotencyKey = requireIdempotencyKey(req.headers["x-idempotency-key"]);
  const { recipient, note } = req.body;

  const { body, replay } = await withWalletIdempotency({
    scope: "wallet_transfer",
    key: idempotencyKey,
    actorId: req.user.id,
    run: async () =>
      transferBetweenUsers({
        senderUserId: req.user.id,
        recipientLookup: recipient,
        amountMinor,
        note,
        idempotencyKey,
      }),
  });

  res.status(replay ? 200 : 201).json(body);
}

export async function createWithdrawal(req, res) {
  const amountMinor = parseBodyAmount(req.body);
  assertAmountInRange(amountMinor, {
    min: walletConfig.withdrawalMinMinor,
    max: walletConfig.withdrawalMaxMinor,
  });

  const idempotencyKey = requireIdempotencyKey(req.headers["x-idempotency-key"]);
  const { method, destination } = req.body;

  const { body, replay } = await withWalletIdempotency({
    scope: "wallet_withdrawal",
    key: idempotencyKey,
    actorId: req.user.id,
    run: async () =>
      createWithdrawalRequest({
        userId: req.user.id,
        amountMinor,
        method,
        destination,
        idempotencyKey,
      }),
  });

  res.status(replay ? 200 : 201).json(body);
}

export async function cancelWithdrawal(req, res) {
  const { id: withdrawalId } = req.params;
  const idempotencyKey = requireIdempotencyKey(req.headers["x-idempotency-key"]);

  const { body, replay } = await withWalletIdempotency({
    scope: "wallet_withdrawal_cancel",
    key: idempotencyKey,
    actorId: req.user.id,
    run: async () =>
      cancelWithdrawalByUser({
        userId: req.user.id,
        withdrawalId,
      }),
  });

  res.status(replay ? 200 : 200).json(body);
}

export async function payOrderWithWalletController(req, res) {
  const { id: orderId } = req.params;
  const idempotencyKey = requireIdempotencyKey(req.headers["x-idempotency-key"]);

  const { body, replay } = await withWalletIdempotency({
    scope: "wallet_order_pay",
    key: idempotencyKey,
    actorId: req.user.id,
    run: async () => payOrderWithWallet({ userId: req.user.id, orderId, idempotencyKey }),
  });

  res.status(replay ? 200 : 200).json(body);
}
