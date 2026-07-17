-- AlterEnum: borrador de pedido sin pago confirmado
ALTER TYPE "OrderStatus" ADD VALUE IF NOT EXISTS 'PENDING_PAYMENT';

-- CreateIndex
CREATE INDEX IF NOT EXISTS "orders_stripePaymentId_idx" ON "orders"("stripePaymentId");
