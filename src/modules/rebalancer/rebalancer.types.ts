import { Prisma, Portfolio } from "@prisma/client";
export type HealthState = "HEALTHY" | "DEGRADED" | "UNHEALTHY" | "DEAD";

export type RebalanceToken = {
  symbol: string;
  address: string;
  decimals: number;     // token decimals
  balance: number;      // token amount
  targetPercent: number; // e.g., 0.3 = 30%
  currentValue?: number; // will be calculated
  targetValue?: number;  // will be calculated
  drift?: number;        // calculated drift
};

export type RebalancePortfolio = {
  portfolioId: string;
  smartAccountId: string;
  portfolioAddress?: string; // Added for slippage protection
  tokens: RebalanceToken[];
};

export type RebalanceResult =
  | { action: "NO_REBALANCE"; reason?: string; maxDrift?: number }
  | { action: "REBALANCE"; params: RebalanceParams[]; maxDrift?: number };

export type RebalanceParams = {
  botAddress: string;
  tokenIn: string;
  tokenOut: string;
  amountIn: bigint;
  amountOutMin: bigint;
  swapPath: string[];
  reason: string;
};


export type PortfolioWithAllocations = Prisma.PortfolioGetPayload<{
  include: {
    allocations: {
      include: {
        token: true;
      };
    };
  };
}>;