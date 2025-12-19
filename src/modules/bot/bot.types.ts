/**
 * Type definitions for bot operations
 */

export interface LLMAdjustment {
    tokenOut: string;      // Token to reduce/sell
    tokenIn: string;       // Token to increase/buy
    percentage: number;    // Percentage of portfolio to adjust
    reason?: string;       // Explanation for this adjustment
}

export interface BotConfig {
    id: string;
    name: string;
    status: "active" | "inactive" | "running" | "error";
    strategy?: string;
    riskLevel?: "low" | "medium" | "high";
    createdAt?: Date;
    updatedAt?: Date;
}

export interface PortfolioAllocation {
    tokenId: string;
    token?: {
        symbol: string;
        address: string;
        decimals: number;
    };
    percentage: number;          // Target allocation percentage
    currentValue?: number;       // Current USD value
    amount?: string;            // Token amount
}

export interface Portfolio {
    id: string;
    name: string;
    smartAccountId: string;
    allocations: PortfolioAllocation[];
    rebalanceLogs?: RebalanceLog[];
    totalValue?: number;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface RebalanceLog {
    id: string;
    portfolioId: string;
    tokenInId: string;
    tokenOutId: string;
    amountIn: string;
    amountOut: string;
    reason: string;
    status: "pending" | "completed" | "failed";
    transactionHash?: string;
    createdAt: Date;
    timestamp?: Date;
}




export type RebalanceParams = {
    botAddress: string;
    tokenIn: string;
    tokenOut: string;
    amountIn: bigint;
    amountOutMin: bigint;
    swapPath: string[];
    reason: string;
}