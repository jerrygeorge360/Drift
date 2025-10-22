-- DropIndex
DROP INDEX "public"."Delegation_smartAccountId_key";

-- AlterTable
ALTER TABLE "SmartAccount" ADD COLUMN     "ownerAddress" TEXT;
