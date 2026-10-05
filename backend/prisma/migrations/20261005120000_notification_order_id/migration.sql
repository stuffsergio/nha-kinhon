-- AlterTable
ALTER TABLE "notifications" ADD COLUMN "orderId" TEXT;

-- CreateIndex
CREATE INDEX "notifications_orderId_idx" ON "notifications"("orderId");

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;
