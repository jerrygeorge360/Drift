/*
  Warnings:

  - You are about to drop the column `createdAt` on the `ContractConfig` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[name]` on the table `ContractConfig` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `name` to the `ContractConfig` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "ContractConfig" DROP COLUMN "createdAt",
ADD COLUMN     "name" TEXT NOT NULL,
ALTER COLUMN "network" SET DEFAULT 'monadTestnet';

-- CreateIndex
CREATE UNIQUE INDEX "ContractConfig_name_key" ON "ContractConfig"("name");
