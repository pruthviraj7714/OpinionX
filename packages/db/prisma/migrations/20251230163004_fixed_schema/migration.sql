/*
  Warnings:

  - You are about to alter the column `feePercent` on the `Market` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(5,2)`.

*/
-- AlterTable
ALTER TABLE "Market" ALTER COLUMN "feePercent" SET DATA TYPE DECIMAL(5,2),
ALTER COLUMN "noPool" SET DATA TYPE DECIMAL(18,6),
ALTER COLUMN "yesPool" SET DATA TYPE DECIMAL(18,6);

-- AlterTable
ALTER TABLE "Position" ALTER COLUMN "yesShares" SET DEFAULT 0,
ALTER COLUMN "yesShares" SET DATA TYPE DECIMAL(18,6),
ALTER COLUMN "noShares" SET DEFAULT 0,
ALTER COLUMN "noShares" SET DATA TYPE DECIMAL(18,6);

-- AlterTable
ALTER TABLE "Trade" ALTER COLUMN "price" SET DATA TYPE DECIMAL(18,6),
ALTER COLUMN "amountIn" SET DATA TYPE DECIMAL(18,6),
ALTER COLUMN "amountOut" SET DATA TYPE DECIMAL(18,6);

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "balance" SET DEFAULT 1000000,
ALTER COLUMN "balance" SET DATA TYPE DECIMAL(18,6);

-- CreateTable
CREATE TABLE "PlatformFee" (
    "id" TEXT NOT NULL,
    "marketId" TEXT NOT NULL,
    "amount" DECIMAL(18,6) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlatformFee_pkey" PRIMARY KEY ("id")
);
