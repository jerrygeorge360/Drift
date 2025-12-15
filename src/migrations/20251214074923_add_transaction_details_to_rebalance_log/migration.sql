/*
  Warnings:

  - A unique constraint covering the columns `[transactionHash]` on the table `RebalanceLog` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "RebalanceLog" ADD COLUMN     "blockNumber" TEXT,
ADD COLUMN     "gasUsed" TEXT,
ADD COLUMN     "status" TEXT,
ADD COLUMN     "transactionHash" TEXT,
ADD COLUMN     "userOpHash" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "RebalanceLog_transactionHash_key" ON "RebalanceLog"("transactionHash");
