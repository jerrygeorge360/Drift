-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "walletAddress" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'user',
    "lastLogin" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SmartAccount" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "privateKey" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "ownerAddress" TEXT,
    "deployed" BOOLEAN NOT NULL DEFAULT false,
    "deployedAt" TIMESTAMP(3),
    "deploymentTxHash" TEXT,

    CONSTRAINT "SmartAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Delegation" (
    "id" TEXT NOT NULL,
    "smartAccountId" TEXT NOT NULL,
    "delegatorAddress" TEXT NOT NULL,
    "delegateAddress" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "revoked" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "signature" JSONB NOT NULL,

    CONSTRAINT "Delegation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Portfolio" (
    "id" TEXT NOT NULL,
    "smartAccountId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "portfolioAddress" TEXT,

    CONSTRAINT "Portfolio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Token" (
    "id" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "decimals" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Token_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PortfolioAllocation" (
    "id" TEXT NOT NULL,
    "portfolioId" TEXT NOT NULL,
    "tokenId" TEXT NOT NULL,
    "percent" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL DEFAULT 0,

    CONSTRAINT "PortfolioAllocation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RebalanceLog" (
    "id" TEXT NOT NULL,
    "portfolioId" TEXT NOT NULL,
    "tokenInId" TEXT NOT NULL,
    "tokenOutId" TEXT NOT NULL,
    "amountIn" DOUBLE PRECISION NOT NULL,
    "amountOut" DOUBLE PRECISION NOT NULL,
    "reason" TEXT NOT NULL,
    "executor" TEXT NOT NULL,
    "driftPercentage" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "blockNumber" TEXT,
    "gasUsed" TEXT,
    "status" TEXT,
    "transactionHash" TEXT,
    "userOpHash" TEXT,

    CONSTRAINT "RebalanceLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContractConfig" (
    "id" TEXT NOT NULL,
    "contractAddress" TEXT NOT NULL,
    "network" TEXT NOT NULL DEFAULT 'monadTestnet',
    "owner" TEXT NOT NULL,
    "paused" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "ContractConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Bot" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "description" TEXT,
    "encryptedKey" TEXT,
    "role" TEXT NOT NULL DEFAULT 'bot',
    "lastRunAt" TIMESTAMP(3),
    "status" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Bot_pkey" PRIMARY KEY ("id")
);

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

-- CreateTable
CREATE TABLE "Analysis" (
    "id" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Analysis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Memory" (
    "id" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Memory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_walletAddress_key" ON "User"("walletAddress");

-- CreateIndex
CREATE UNIQUE INDEX "SmartAccount_address_key" ON "SmartAccount"("address");

-- CreateIndex
CREATE UNIQUE INDEX "Delegation_smartAccountId_key" ON "Delegation"("smartAccountId");

-- CreateIndex
CREATE INDEX "Delegation_smartAccountId_idx" ON "Delegation"("smartAccountId");

-- CreateIndex
CREATE INDEX "Delegation_delegateAddress_idx" ON "Delegation"("delegateAddress");

-- CreateIndex
CREATE UNIQUE INDEX "Portfolio_smartAccountId_key" ON "Portfolio"("smartAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Portfolio_portfolioAddress_key" ON "Portfolio"("portfolioAddress");

-- CreateIndex
CREATE UNIQUE INDEX "Token_symbol_key" ON "Token"("symbol");

-- CreateIndex
CREATE UNIQUE INDEX "Token_address_key" ON "Token"("address");

-- CreateIndex
CREATE UNIQUE INDEX "PortfolioAllocation_portfolioId_tokenId_key" ON "PortfolioAllocation"("portfolioId", "tokenId");

-- CreateIndex
CREATE UNIQUE INDEX "RebalanceLog_transactionHash_key" ON "RebalanceLog"("transactionHash");

-- CreateIndex
CREATE UNIQUE INDEX "ContractConfig_contractAddress_key" ON "ContractConfig"("contractAddress");

-- CreateIndex
CREATE UNIQUE INDEX "ContractConfig_name_key" ON "ContractConfig"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Bot_name_key" ON "Bot"("name");

-- CreateIndex
CREATE INDEX "TokenPrice_symbol_lastUpdatedAt_idx" ON "TokenPrice"("symbol", "lastUpdatedAt");

-- AddForeignKey
ALTER TABLE "SmartAccount" ADD CONSTRAINT "SmartAccount_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Portfolio" ADD CONSTRAINT "Portfolio_smartAccountId_fkey" FOREIGN KEY ("smartAccountId") REFERENCES "SmartAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PortfolioAllocation" ADD CONSTRAINT "PortfolioAllocation_portfolioId_fkey" FOREIGN KEY ("portfolioId") REFERENCES "Portfolio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PortfolioAllocation" ADD CONSTRAINT "PortfolioAllocation_tokenId_fkey" FOREIGN KEY ("tokenId") REFERENCES "Token"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RebalanceLog" ADD CONSTRAINT "RebalanceLog_portfolioId_fkey" FOREIGN KEY ("portfolioId") REFERENCES "Portfolio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RebalanceLog" ADD CONSTRAINT "RebalanceLog_tokenInId_fkey" FOREIGN KEY ("tokenInId") REFERENCES "Token"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RebalanceLog" ADD CONSTRAINT "RebalanceLog_tokenOutId_fkey" FOREIGN KEY ("tokenOutId") REFERENCES "Token"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
