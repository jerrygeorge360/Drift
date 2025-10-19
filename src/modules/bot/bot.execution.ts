import { redeemDelegationService } from "./bot.delegation.js";
import { createRebalanceLog } from "../../utils/dbhelpers.js";
import { calculateAmounts } from "../../utils/oraclehelper.js";
import { LLMAdjustment } from "./bot.types.js";

export async function executeRebalances(
    bot: any,
    smartAccountId: string,
    portfolio: any,
    adjustments: LLMAdjustment[],
    reason: string,
    marketData: any
) {
    console.log(`🤖 [${bot.name}] Starting rebalance cycle for SmartAccount: ${smartAccountId}`);
    console.log(`   Redeeming delegations first...`);

    const redeemedRebalances = [];

    // 🔹 Recompute total portfolio value from allocations + live market data
    const totalValue = portfolio.allocations.reduce((acc: number, alloc: any) => {
        const price = marketData?.[alloc.tokenId]?.usd || 0;
        return acc + alloc.amount * price;
    }, 0);

    console.log(`💰 Computed portfolio total value: $${totalValue.toFixed(2)}`);

    for (const adj of adjustments) {
        try {
            const { amountIn, amountOut, swapValue } = calculateAmounts(
                adj,
                portfolio.allocations,
                marketData,
                totalValue
            );

            console.log(`  ↻ ${adj.tokenOutId} → ${adj.tokenInId}`);
            console.log(`     Swap ${adj.percent}% of portfolio (${swapValue.toFixed(2)} USD)`);
            console.log(`     Out: ${amountOut.toFixed(6)} ${adj.tokenOutId}`);
            console.log(`     In: ${amountIn.toFixed(6)} ${adj.tokenInId}`);

            const logEntry = {
                portfolioId: portfolio.id,
                tokenInId: adj.tokenInId,
                tokenOutId: adj.tokenOutId,
                amountIn,
                amountOut,
                reason: `${reason} (rebalance executed)`,
                executor: bot.name,
            };

            const rebalanceParams = {
                botAddress: bot.address,
                tokenIn: adj.tokenInId,
                tokenOut: adj.tokenOutId,
                amountIn: BigInt(Math.floor(amountIn)),
                amountOutMin: BigInt(Math.floor(amountOut * 0.98)), // 2% slippage protection
                swapPath: [adj.tokenOutId, adj.tokenInId],
                reason,
            };

            await redeemDelegationService(smartAccountId, rebalanceParams);
            redeemedRebalances.push(logEntry);

        } catch (error: any) {
            console.error(`❌ [${bot.name}] Failed adjustment ${adj.tokenOutId} → ${adj.tokenInId}:`, error.message);
        }
    }

    // 🔹 Log only successful rebalances
    if (redeemedRebalances.length > 0) {
        await createRebalanceLog(redeemedRebalances);
        console.log(`✅ Logged ${redeemedRebalances.length} successful rebalances.`);
    } else {
        console.log(`⚠️ No successful rebalances to log.`);
    }

    return {
        status: redeemedRebalances.length > 0 ? "redeemed_and_rebalanced" : "no_valid_rebalances",
        rebalanceResults: redeemedRebalances,
        reason,
    };
}
