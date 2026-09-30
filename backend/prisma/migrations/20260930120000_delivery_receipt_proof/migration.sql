-- AlterEnum
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'ORDER_COURIER_NEARBY';

-- AlterTable
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "courierNearbyNotifiedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE IF NOT EXISTS "order_delivery_photos" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "uploadedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "order_delivery_photos_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "order_delivery_photos_orderId_idx" ON "order_delivery_photos"("orderId");

ALTER TABLE "order_delivery_photos" DROP CONSTRAINT IF EXISTS "order_delivery_photos_orderId_fkey";
ALTER TABLE "order_delivery_photos" ADD CONSTRAINT "order_delivery_photos_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
