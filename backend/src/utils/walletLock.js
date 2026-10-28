import { codedError } from "./errors.js";

export async function lockWalletRow(tx, walletId) {
  const rows = await tx.$queryRaw`
    SELECT id FROM wallets WHERE id = ${walletId} FOR UPDATE
  `;
  if (!rows?.length) {
    throw codedError("WALLET_NOT_FOUND", 404);
  }
}

/** Lock two wallets in stable order to avoid deadlocks. */
export async function lockWalletPair(tx, walletIdA, walletIdB) {
  const [first, second] = walletIdA < walletIdB ? [walletIdA, walletIdB] : [walletIdB, walletIdA];
  await lockWalletRow(tx, first);
  if (first !== second) {
    await lockWalletRow(tx, second);
  }
}

export async function sumLedgerBalancesTx(tx, walletId) {
  const rows = await tx.$queryRaw`
    SELECT
      COALESCE(SUM(CASE WHEN side = 'CREDIT' AND status = 'POSTED' THEN "amountMinor" ELSE 0 END), 0)::int AS credits,
      COALESCE(SUM(CASE WHEN side = 'DEBIT' AND status = 'POSTED' THEN "amountMinor" ELSE 0 END), 0)::int AS debits_posted,
      COALESCE(SUM(CASE WHEN side = 'DEBIT' AND status = 'PENDING' THEN "amountMinor" ELSE 0 END), 0)::int AS debits_pending
    FROM ledger_entries
    WHERE "walletId" = ${walletId}
  `;
  const row = rows[0] || { credits: 0, debits_posted: 0, debits_pending: 0 };
  const credits = Number(row.credits) || 0;
  const debitsPosted = Number(row.debits_posted) || 0;
  const debitsPending = Number(row.debits_pending) || 0;
  const balanceMinor = credits - debitsPosted;
  const availableMinor = balanceMinor - debitsPending;
  return {
    balanceMinor,
    pendingHoldMinor: debitsPending,
    availableMinor,
  };
}

export function assertSufficientAvailable(availableMinor, amountMinor) {
  if (availableMinor < amountMinor) {
    throw codedError("WALLET_INSUFFICIENT_FUNDS", 409);
  }
}
