/*
  Warnings:

  - A unique constraint covering the columns `[smartAccountId]` on the table `Delegation` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Delegation_smartAccountId_key" ON "Delegation"("smartAccountId");
