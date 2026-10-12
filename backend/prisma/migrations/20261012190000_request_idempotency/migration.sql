CREATE TABLE "request_idempotency" (
  "id" TEXT NOT NULL,
  "scope" TEXT NOT NULL,
  "key" TEXT NOT NULL,
  "actorId" TEXT NOT NULL,
  "orderId" TEXT,
  "responseBody" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "request_idempotency_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "request_idempotency_scope_key_key" ON "request_idempotency"("scope", "key");
CREATE INDEX "request_idempotency_actorId_idx" ON "request_idempotency"("actorId");
