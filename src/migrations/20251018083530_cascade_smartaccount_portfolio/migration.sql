-- DropForeignKey
ALTER TABLE "public"."Portfolio" DROP CONSTRAINT "Portfolio_smartAccountId_fkey";

-- AddForeignKey
ALTER TABLE "Portfolio" ADD CONSTRAINT "Portfolio_smartAccountId_fkey" FOREIGN KEY ("smartAccountId") REFERENCES "SmartAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;
