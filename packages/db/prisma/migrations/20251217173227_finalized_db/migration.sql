/*
  Warnings:

  - Added the required column `expiryTime` to the `Market` table without a default value. This is not possible if the table is not empty.
  - Added the required column `status` to the `Market` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Market` table without a default value. This is not possible if the table is not empty.
  - Added the required column `orderType` to the `Order` table without a default value. This is not possible if the table is not empty.
  - Added the required column `price` to the `Order` table without a default value. This is not possible if the table is not empty.
  - Added the required column `quantity` to the `Order` table without a default value. This is not possible if the table is not empty.
  - Added the required column `remainingQuantity` to the `Order` table without a default value. This is not possible if the table is not empty.
  - Added the required column `side` to the `Order` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `Order` table without a default value. This is not possible if the table is not empty.
  - Added the required column `buyerId` to the `Trade` table without a default value. This is not possible if the table is not empty.
  - Added the required column `price` to the `Trade` table without a default value. This is not possible if the table is not empty.
  - Added the required column `quantity` to the `Trade` table without a default value. This is not possible if the table is not empty.
  - Added the required column `sellerId` to the `Trade` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "MarketStatus" AS ENUM ('OPEN', 'CLOSED', 'RESOLVED');

-- CreateEnum
CREATE TYPE "Outcome" AS ENUM ('YES', 'NO');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('OPEN', 'PARTIAL', 'FILLED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "OrderType" AS ENUM ('BUY', 'SELL');

-- AlterTable
ALTER TABLE "Market" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "expiryTime" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "resolvedOutcome" "Outcome",
ADD COLUMN     "status" "MarketStatus" NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "orderType" "OrderType" NOT NULL,
ADD COLUMN     "price" INTEGER NOT NULL,
ADD COLUMN     "quantity" INTEGER NOT NULL,
ADD COLUMN     "remainingQuantity" INTEGER NOT NULL,
ADD COLUMN     "side" "Outcome" NOT NULL,
ADD COLUMN     "status" "OrderStatus" NOT NULL DEFAULT 'OPEN',
ADD COLUMN     "userId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Trade" ADD COLUMN     "buyerId" TEXT NOT NULL,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "price" INTEGER NOT NULL,
ADD COLUMN     "quantity" INTEGER NOT NULL,
ADD COLUMN     "sellerId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "balance" INTEGER NOT NULL DEFAULT 1000000,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "lockedBalance" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
