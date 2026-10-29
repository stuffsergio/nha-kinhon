-- Wallet deep-link fields for push + inbox (mobile wallet PR #28)
ALTER TABLE "notifications" ADD COLUMN IF NOT EXISTS "walletTransactionId" TEXT;
ALTER TABLE "notifications" ADD COLUMN IF NOT EXISTS "withdrawalRequestId" TEXT;

CREATE INDEX IF NOT EXISTS "notifications_walletTransactionId_idx" ON "notifications"("walletTransactionId");
CREATE INDEX IF NOT EXISTS "notifications_withdrawalRequestId_idx" ON "notifications"("withdrawalRequestId");
