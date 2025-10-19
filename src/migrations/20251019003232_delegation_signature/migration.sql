/*
  Warnings:

  - Changed the type of `signature` on the `Delegation` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "Delegation" DROP COLUMN "signature",
ADD COLUMN     "signature" JSONB NOT NULL;
