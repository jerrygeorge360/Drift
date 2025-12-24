-- CreateTable or AlterTable for Portfolio
-- Add portfolioAddress column to existing Portfolio table

-- For PostgreSQL:
ALTER TABLE "Portfolio" ADD COLUMN "portfolioAddress" TEXT;
ALTER TABLE "Portfolio" ADD CONSTRAINT "Portfolio_portfolioAddress_key" UNIQUE ("portfolioAddress");

-- For development, you can also use:
-- UPDATE "Portfolio" SET "portfolioAddress" = NULL WHERE "portfolioAddress" IS NULL;
