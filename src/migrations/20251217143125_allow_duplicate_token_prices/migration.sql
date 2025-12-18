-- CreateTable
CREATE TABLE "TokenPrice" (
    "id" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "usdPrice" DOUBLE PRECISION NOT NULL,
    "usdMarketCap" DOUBLE PRECISION,
    "usd24hVol" DOUBLE PRECISION,
    "usd24hChange" DOUBLE PRECISION,
    "lastUpdatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TokenPrice_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TokenPrice_symbol_lastUpdatedAt_idx" ON "TokenPrice"("symbol", "lastUpdatedAt");
