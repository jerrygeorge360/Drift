/**
 * Adjustment suggested by the LLM
 * Represents a portfolio rebalancing action where a percentage of the portfolio
 * is swapped from one token to another
 */
export interface LLMAdjustment {
    /** Token ID to buy/receive (e.g., "ethereum", "bitcoin") */
    tokenInId: string;

    /** Token ID to sell/send (e.g., "ethereum", "bitcoin") */
    tokenOutId: string;

    /** Percentage of total portfolio value to swap (0-100) */
    percent: number;
}

/**
 * Calculated amounts for executing a rebalance
 * Derived from LLMAdjustment by applying market prices
 */
export interface CalculatedAdjustment extends LLMAdjustment {
    /** Actual amount of tokenOut to sell (in token units) */
    amountOut: number;

    /** Actual amount of tokenIn to receive (in token units) */
    amountIn: number;

    /** USD value of the swap */
    swapValue: number;

    /** Price of tokenOut at time of calculation */
    tokenOutPrice: number;

    /** Price of tokenIn at time of calculation */
    tokenInPrice: number;
}

/**
 * LLM Decision response structure
 */
export interface LLMDecision {
    /** Action to take */
    action: "redeem" | "rebalance" | "none";

    /** Explanation for the decision */
    reason: string;

    /** List of rebalancing adjustments (optional, only for redeem/rebalance actions) */
    adjustments?: LLMAdjustment[];
}

/**
 * Rebalance execution result
 */
export interface RebalanceResult {
    /** Unique ID of the rebalance log entry */
    id: string;

    /** Portfolio ID */
    portfolioId: string;

    /** Token bought */
    tokenInId: string;

    /** Token sold */
    tokenOutId: string;

    /** Amount bought */
    amountIn: number;

    /** Amount sold */
    amountOut: number;

    /** Reason for rebalance */
    reason: string;

    /** Who executed (bot name) */
    executor: string;

    /** Timestamp */
    createdAt: Date;

    /** Transaction hash (if on-chain) */
    txHash?: string;

    /** Status of execution */
    status: "pending" | "completed" | "failed";
}

/**
 * Agent execution result
 */
export interface AgentRunResult {
    /** Status of the agent run */
    status: "idle" | "rebalanced" | "redeemed_and_rebalanced" | "unknown" | "error";

    /** Explanation of what happened */
    reason: string;

    /** Rebalance results (if any rebalances were executed) */
    rebalanceResults?: RebalanceResult[];

    /** Redemption result (if delegations were redeemed) */
    redemptionResult?: {
        success: boolean;
        message: string;
        redeemedCount: number;
    };

    /** Error details (if status is "error") */
    error?: {
        message: string;
        stack?: string;
    };
}