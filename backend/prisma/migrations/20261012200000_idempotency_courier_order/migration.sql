DROP INDEX IF EXISTS "request_idempotency_scope_key_key";

CREATE UNIQUE INDEX "request_idempotency_scope_actorId_orderId_key_key"
  ON "request_idempotency"("scope", "actorId", "orderId", "key");

CREATE INDEX IF NOT EXISTS "request_idempotency_orderId_idx" ON "request_idempotency"("orderId");
