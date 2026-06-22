-- AlterEnum
ALTER TYPE "NotificationType" ADD VALUE 'ORDER_PICKED_UP';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "OrderStatus" ADD VALUE 'PICKED_UP';
ALTER TYPE "OrderStatus" ADD VALUE 'IN_TRANSIT';

-- AlterEnum
ALTER TYPE "Role" ADD VALUE 'DELIVERY';

-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "deliveredAt" TIMESTAMP(3),
ADD COLUMN     "deliveryId" TEXT,
ADD COLUMN     "pickedUpAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "delivery_profiles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "vehicle" TEXT NOT NULL,
    "serviceArea" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "totalDeliveries" INTEGER NOT NULL DEFAULT 0,
    "rating" DOUBLE PRECISION NOT NULL DEFAULT 5.0,
    "currentLocation" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "delivery_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "delivery_profiles_userId_key" ON "delivery_profiles"("userId");

-- CreateIndex
CREATE INDEX "orders_deliveryId_idx" ON "orders"("deliveryId");

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_deliveryId_fkey" FOREIGN KEY ("deliveryId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "delivery_profiles" ADD CONSTRAINT "delivery_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
