CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- User soft-delete / block
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3);
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "isBlocked" BOOLEAN NOT NULL DEFAULT false;
CREATE INDEX IF NOT EXISTS "users_deletedAt_idx" ON "users"("deletedAt");

-- Wallet enums
CREATE TYPE "LedgerSide" AS ENUM ('DEBIT', 'CREDIT');
CREATE TYPE "LedgerEntryType" AS ENUM ('DEPOSIT', 'WITHDRAWAL', 'TRANSFER_IN', 'TRANSFER_OUT', 'ORDER_PAYMENT', 'REFUND', 'ADJUSTMENT');
CREATE TYPE "LedgerEntryStatus" AS ENUM ('PENDING', 'POSTED', 'REVERSED');
CREATE TYPE "WalletTransactionType" AS ENUM ('DEPOSIT', 'WITHDRAWAL', 'TRANSFER_OUT', 'TRANSFER_IN', 'ORDER_PAYMENT', 'REFUND', 'ADJUSTMENT');
CREATE TYPE "WalletTransactionStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED', 'CANCELLED', 'REVERSED');
CREATE TYPE "WithdrawalMethod" AS ENUM ('MOBILE_MONEY', 'BANK');
CREATE TYPE "WithdrawalRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'PAID', 'CANCELLED');

CREATE TABLE "wallets" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'XOF',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "wallets_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "wallets_userId_key" ON "wallets"("userId");

CREATE TABLE "wallet_transactions" (
  "id" TEXT NOT NULL,
  "walletId" TEXT NOT NULL,
  "type" "WalletTransactionType" NOT NULL,
  "status" "WalletTransactionStatus" NOT NULL DEFAULT 'PENDING',
  "amountMinor" INTEGER NOT NULL,
  "counterpartyWalletId" TEXT,
  "orderId" TEXT,
  "note" TEXT,
  "stripePaymentIntentId" TEXT,
  "idempotencyKey" TEXT,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "wallet_transactions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "wallet_transactions_idempotencyKey_key" ON "wallet_transactions"("idempotencyKey");
CREATE INDEX "wallet_transactions_walletId_createdAt_idx" ON "wallet_transactions"("walletId", "createdAt");
CREATE INDEX "wallet_transactions_status_idx" ON "wallet_transactions"("status");
CREATE INDEX "wallet_transactions_orderId_idx" ON "wallet_transactions"("orderId");

CREATE TABLE "ledger_entries" (
  "id" TEXT NOT NULL,
  "walletId" TEXT NOT NULL,
  "side" "LedgerSide" NOT NULL,
  "amountMinor" INTEGER NOT NULL,
  "entryType" "LedgerEntryType" NOT NULL,
  "status" "LedgerEntryStatus" NOT NULL DEFAULT 'POSTED',
  "reference" TEXT,
  "idempotencyKey" TEXT,
  "walletTransactionId" TEXT,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ledger_entries_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ledger_entries_idempotencyKey_key" ON "ledger_entries"("idempotencyKey");
CREATE INDEX "ledger_entries_walletId_idx" ON "ledger_entries"("walletId");
CREATE INDEX "ledger_entries_walletTransactionId_idx" ON "ledger_entries"("walletTransactionId");
CREATE INDEX "ledger_entries_status_idx" ON "ledger_entries"("status");

CREATE TABLE "withdrawal_requests" (
  "id" TEXT NOT NULL,
  "walletTransactionId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "amountMinor" INTEGER NOT NULL,
  "method" "WithdrawalMethod" NOT NULL,
  "destination" JSONB NOT NULL,
  "status" "WithdrawalRequestStatus" NOT NULL DEFAULT 'PENDING',
  "adminNote" TEXT,
  "reviewedById" TEXT,
  "reviewedAt" TIMESTAMP(3),
  "paidAt" TIMESTAMP(3),
  "payoutReference" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "withdrawal_requests_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "withdrawal_requests_walletTransactionId_key" ON "withdrawal_requests"("walletTransactionId");
CREATE INDEX "withdrawal_requests_userId_idx" ON "withdrawal_requests"("userId");
CREATE INDEX "withdrawal_requests_status_idx" ON "withdrawal_requests"("status");

CREATE TABLE "wallet_request_idempotency" (
  "id" TEXT NOT NULL,
  "scope" TEXT NOT NULL,
  "key" TEXT NOT NULL,
  "actorId" TEXT NOT NULL,
  "responseBody" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "wallet_request_idempotency_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "wallet_request_idempotency_scope_actorId_key_key" ON "wallet_request_idempotency"("scope", "actorId", "key");
CREATE INDEX "wallet_request_idempotency_actorId_idx" ON "wallet_request_idempotency"("actorId");

ALTER TABLE "wallets" ADD CONSTRAINT "wallets_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "wallet_transactions" ADD CONSTRAINT "wallet_transactions_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "wallets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ledger_entries" ADD CONSTRAINT "ledger_entries_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "wallets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ledger_entries" ADD CONSTRAINT "ledger_entries_walletTransactionId_fkey" FOREIGN KEY ("walletTransactionId") REFERENCES "wallet_transactions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "withdrawal_requests" ADD CONSTRAINT "withdrawal_requests_walletTransactionId_fkey" FOREIGN KEY ("walletTransactionId") REFERENCES "wallet_transactions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Notification types (append)
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'WALLET_DEPOSIT_RECEIVED';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'WALLET_TRANSFER_SENT';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'WALLET_TRANSFER_RECEIVED';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'WALLET_WITHDRAWAL_APPROVED';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'WALLET_WITHDRAWAL_REJECTED';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'WALLET_WITHDRAWAL_PAID';

-- Backfill wallets for existing users (legacy balance → opening ADJUSTMENT credit)
INSERT INTO "wallets" ("id", "userId", "currency", "createdAt", "updatedAt")
SELECT gen_random_uuid()::text, u."id", 'XOF', NOW(), NOW()
FROM "users" u
WHERE NOT EXISTS (SELECT 1 FROM "wallets" w WHERE w."userId" = u."id");

-- Opening balance from legacy float column (rounded to integer minor units)
INSERT INTO "wallet_transactions" ("id", "walletId", "type", "status", "amountMinor", "note", "createdAt", "updatedAt")
SELECT
  gen_random_uuid()::text,
  w."id",
  'ADJUSTMENT'::"WalletTransactionType",
  'COMPLETED'::"WalletTransactionStatus",
  GREATEST(0, ROUND(u."balance")::integer),
  'Migración saldo legacy',
  NOW(),
  NOW()
FROM "wallets" w
JOIN "users" u ON u."id" = w."userId"
WHERE GREATEST(0, ROUND(u."balance")::integer) > 0
  AND NOT EXISTS (
    SELECT 1 FROM "wallet_transactions" wt
    WHERE wt."walletId" = w."id" AND wt."note" = 'Migración saldo legacy'
  );

INSERT INTO "ledger_entries" ("id", "walletId", "side", "amountMinor", "entryType", "status", "reference", "idempotencyKey", "walletTransactionId", "createdAt")
SELECT
  gen_random_uuid()::text,
  wt."walletId",
  'CREDIT'::"LedgerSide",
  wt."amountMinor",
  'ADJUSTMENT'::"LedgerEntryType",
  'POSTED'::"LedgerEntryStatus",
  'legacy-balance-migration',
  'legacy-balance-' || wt."walletId",
  wt."id",
  NOW()
FROM "wallet_transactions" wt
WHERE wt."note" = 'Migración saldo legacy'
  AND NOT EXISTS (
    SELECT 1 FROM "ledger_entries" le WHERE le."idempotencyKey" = 'legacy-balance-' || wt."walletId"
  );
