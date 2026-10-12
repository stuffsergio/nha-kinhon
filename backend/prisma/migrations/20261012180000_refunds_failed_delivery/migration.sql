-- OrderStatus extensions
ALTER TYPE "OrderStatus" ADD VALUE IF NOT EXISTS 'DELIVERY_FAILED_ATTEMPT';
ALTER TYPE "OrderStatus" ADD VALUE IF NOT EXISTS 'UNDELIVERABLE';
ALTER TYPE "OrderStatus" ADD VALUE IF NOT EXISTS 'REFUNDED';
ALTER TYPE "OrderStatus" ADD VALUE IF NOT EXISTS 'PARTIALLY_REFUNDED';

-- New enums
CREATE TYPE "DeliveryFailureReason" AS ENUM (
  'RECIPIENT_ABSENT',
  'WRONG_ADDRESS',
  'RECIPIENT_REFUSED',
  'UNREACHABLE_PHONE',
  'ACCESS_BLOCKED',
  'PRODUCT_DAMAGED',
  'OTHER'
);

CREATE TYPE "OrderEventType" AS ENUM (
  'DELIVERY_FAILED',
  'BUYER_RECIPIENT_UPDATED',
  'BUYER_REQUEST_REATTEMPT',
  'BUYER_CANCEL_REQUEST_REFUND',
  'ADMIN_RESOLVE_UNDELIVERABLE',
  'REFUND_REQUESTED',
  'REFUND_APPROVED',
  'REFUND_REJECTED',
  'REFUND_STRIPE_CREATED',
  'REFUND_COMPLETED',
  'REFUND_FAILED',
  'ORDER_CANCELLED_AUTO_REFUND'
);

CREATE TYPE "RefundStatus" AS ENUM ('PENDING', 'SUCCEEDED', 'FAILED', 'CANCELED');
CREATE TYPE "RefundReason" AS ENUM (
  'CANCEL_BEFORE_DISPATCH',
  'UNDELIVERABLE',
  'DAMAGED_PRODUCT',
  'MISSING_PRODUCT',
  'ADMIN_MANUAL',
  'OTHER'
);

-- Notification types
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'ORDER_DELIVERY_FAILED';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'ORDER_UNDELIVERABLE';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'ORDER_ASSIGNED_COURIER';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'REFUND_REQUESTED';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'REFUND_APPROVED';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'REFUND_REJECTED';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'REFUND_COMPLETED';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'REFUND_FAILED';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'ADMIN_REFUND_REQUEST';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'ADMIN_UNDELIVERABLE';

-- Order columns
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "failedDeliveryAttempts" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "buyerResolutionDeadline" TIMESTAMP(3);

ALTER TABLE "order_delivery_photos" ADD COLUMN IF NOT EXISTS "deliveryAttemptId" TEXT;

CREATE TABLE "delivery_attempts" (
  "id" TEXT NOT NULL,
  "orderId" TEXT NOT NULL,
  "attemptNumber" INTEGER NOT NULL,
  "reason" "DeliveryFailureReason" NOT NULL,
  "note" TEXT,
  "lat" DOUBLE PRECISION,
  "lng" DOUBLE PRECISION,
  "recordedById" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "delivery_attempts_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "order_events" (
  "id" TEXT NOT NULL,
  "orderId" TEXT NOT NULL,
  "type" "OrderEventType" NOT NULL,
  "actorId" TEXT,
  "actorRole" "Role",
  "payload" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "order_events_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "refunds" (
  "id" TEXT NOT NULL,
  "orderId" TEXT NOT NULL,
  "amount" INTEGER NOT NULL,
  "status" "RefundStatus" NOT NULL DEFAULT 'PENDING',
  "stripeRefundId" TEXT,
  "reason" "RefundReason" NOT NULL,
  "requestedById" TEXT,
  "approvedById" TEXT,
  "rejectedById" TEXT,
  "adminNote" TEXT,
  "buyerNote" TEXT,
  "orderItemIds" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "refunds_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "admin_audit_logs" (
  "id" TEXT NOT NULL,
  "adminId" TEXT NOT NULL,
  "action" TEXT NOT NULL,
  "orderId" TEXT,
  "refundId" TEXT,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "admin_audit_logs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "stripe_processed_events" (
  "id" TEXT NOT NULL,
  "eventId" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "stripe_processed_events_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "stripe_processed_events_eventId_key" ON "stripe_processed_events"("eventId");
CREATE INDEX "delivery_attempts_orderId_idx" ON "delivery_attempts"("orderId");
CREATE INDEX "order_events_orderId_idx" ON "order_events"("orderId");
CREATE INDEX "refunds_orderId_idx" ON "refunds"("orderId");
CREATE INDEX "refunds_status_idx" ON "refunds"("status");
CREATE INDEX "refunds_stripeRefundId_idx" ON "refunds"("stripeRefundId");
CREATE INDEX "admin_audit_logs_adminId_idx" ON "admin_audit_logs"("adminId");
CREATE INDEX "admin_audit_logs_orderId_idx" ON "admin_audit_logs"("orderId");
CREATE INDEX "order_delivery_photos_deliveryAttemptId_idx" ON "order_delivery_photos"("deliveryAttemptId");

ALTER TABLE "delivery_attempts" ADD CONSTRAINT "delivery_attempts_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "order_events" ADD CONSTRAINT "order_events_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "refunds" ADD CONSTRAINT "refunds_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "order_delivery_photos" ADD CONSTRAINT "order_delivery_photos_deliveryAttemptId_fkey" FOREIGN KEY ("deliveryAttemptId") REFERENCES "delivery_attempts"("id") ON DELETE SET NULL ON UPDATE CASCADE;
