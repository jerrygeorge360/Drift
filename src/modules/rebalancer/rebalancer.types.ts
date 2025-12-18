
export type HealthState = "HEALTHY" | "DEGRADED" | "UNHEALTHY" | "DEAD";

export type RebalanceToken = {
  symbol: string;
  address: string;
  balance: number;      // token amount
  targetPercent: number; // e.g., 0.3 = 30%
  currentValue?: number; // will be calculated
  targetValue?: number;  // will be calculated
  drift?: number;        // calculated drift
};

export type RebalancePortfolio = {
  portfolioId: string;
  smartAccountId: string;
  tokens: RebalanceToken[];
};

export type RebalanceResult =
  | { action: "NO_REBALANCE"; reason?: string }
  | { action: "REBALANCE"; params: RebalanceParams[] };

export type RebalanceParams = {
  botAddress: string;
  tokenIn: string;
  tokenOut: string;
  amountIn: bigint;
  amountOutMin: bigint;
  swapPath: string[];
  reason: string;
};