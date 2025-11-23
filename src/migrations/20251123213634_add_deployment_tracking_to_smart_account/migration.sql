-- AlterTable
ALTER TABLE "SmartAccount" ADD COLUMN     "deployed" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "deployedAt" TIMESTAMP(3),
ADD COLUMN     "deploymentTxHash" TEXT;
