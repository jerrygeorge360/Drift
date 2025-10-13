import { createRebalanceLog } from "../../utils/dbhelpers.js";

//
// TYPES
//
export interface RebalanceLogParams {
    portfolioId: string;
    tokenInId: string;
    tokenOutId: string;
    amountIn: number;
    amountOut: number;
    reason?: string;
    executor?: string;
}

//
// REBALANCE SERVICE
//
export class RebalanceService {
    /**
     * Log a rebalance operation
     */
    static async logRebalance({
                                  portfolioId,
                                  tokenInId,
                                  tokenOutId,
                                  amountIn,
                                  amountOut,
                                  reason = "Auto rebalance",
                                  executor = "RebalanceBot",
                              }: RebalanceLogParams) {
        // --- Validation ---
        if (!portfolioId || !tokenInId || !tokenOutId) {
            throw new Error("Missing required rebalance fields: portfolioId, tokenInId, or tokenOutId");
        }



        // --- Create DB entry ---
        return await createRebalanceLog({
            portfolioId,
            tokenInId,
            tokenOutId,
            amountIn,
            amountOut,
            reason,
            executor,
        });
    }
}
