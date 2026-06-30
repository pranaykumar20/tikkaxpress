-- AlterTable
ALTER TABLE "MenuCategory" ADD COLUMN "toastGroupGuid" TEXT;

-- AlterTable
ALTER TABLE "MenuItem" ADD COLUMN "toastItemGuid" TEXT,
ADD COLUMN "toastGroupGuid" TEXT,
ADD COLUMN "lastSyncedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "ModifierGroup" ADD COLUMN "toastModifierGroupGuid" TEXT;

-- AlterTable
ALTER TABLE "Order" ADD COLUMN "toastOrderGuid" TEXT,
ADD COLUMN "toastExternalId" TEXT,
ADD COLUMN "toastPaymentIntentId" TEXT,
ADD COLUMN "integrationError" TEXT;

-- AlterTable
ALTER TABLE "Payment" DROP COLUMN IF EXISTS "stripeSessionId",
DROP COLUMN IF EXISTS "stripePaymentIntentId",
ADD COLUMN "toastPaymentIntentId" TEXT,
ADD COLUMN "toastPaymentStatus" TEXT;

-- CreateTable
CREATE TABLE "IntegrationMeta" (
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IntegrationMeta_pkey" PRIMARY KEY ("key")
);

-- CreateIndex
CREATE UNIQUE INDEX "MenuItem_toastItemGuid_key" ON "MenuItem"("toastItemGuid");

-- CreateIndex
CREATE UNIQUE INDEX "Order_toastOrderGuid_key" ON "Order"("toastOrderGuid");

-- CreateIndex
CREATE UNIQUE INDEX "Order_toastExternalId_key" ON "Order"("toastExternalId");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_toastPaymentIntentId_key" ON "Payment"("toastPaymentIntentId");
