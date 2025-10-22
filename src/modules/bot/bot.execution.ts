import { redeemDelegationService } from "./bot.delegation.js";
import { createRebalanceLog } from "../../utils/dbhelpers.js";
import { calculateAmounts } from "../../utils/oraclehelper.js";
import { LLMAdjustment } from "./bot.types.js";
import {parseUnits} from "viem";

interface RebalanceResult {
    status: "success" | "partial" | "failed" | "no_adjustments";
    executedCount: number;
    failedCount: number;
    rebalanceResults: any[];
    failedAdjustments: any[];
    reason: string;
    totalValue: number;
}

interface LogEntry {
    portfolioId: string | number;
    tokenInId: string | number;
    tokenOutId: string | number;
    amountIn: string;
    amountOut: string;
    reason: string;
    executor: string;
    timestamp: Date;
    userOpHash?: string;
    transactionHash?: string;
    status?: string;
}

/**
 * Execute rebalancing adjustments for a portfolio
 */


const s: LLMAdjustment[] =[ {
    tokenOut: "USDT",       // Token to reduce/sell
    tokenIn: "USDC",        // Token to increase/buy
    percentage: 10,         // Percentage of portfolio to adjust
    reason: "hello",        // Optional reason
}];

export async function executeRebalances(
    bot: any,
    smartAccountId: string,
    portfolio: any,
    adjustments: LLMAdjustment[]=s,
    reason: string,
    marketData: any,
    totalValue: any,
): Promise<RebalanceResult> {

    console.log(`🤖 [${bot.name}] Starting rebalance cycle for SmartAccount: ${smartAccountId}`);

    // Validate inputs
    if (!adjustments || adjustments.length === 0) {
        console.log(`⚠️ No adjustments provided, skipping execution`);
        return {
            status: "no_adjustments",
            executedCount: 0,
            failedCount: 0,
            rebalanceResults: [],
            failedAdjustments: [],
            reason: "No adjustments to execute",
            totalValue: totalValue,
        };
    }

    console.log(`   Processing ${adjustments.length} adjustment(s)...`);

    const successfulRebalances: any[] = [];
    const failedAdjustments: any[] = [];

    // 🔹 Calculate total portfolio value from allocations + live market data

    console.log(`💰 Computed portfolio total value: $${totalValue.toFixed(2)}`);

    if (totalValue === 0) {
        console.error(`❌ Portfolio has zero value, cannot rebalance`);
        return {
            status: "failed",
            executedCount: 0,
            failedCount: adjustments.length,
            rebalanceResults: [],
            failedAdjustments: adjustments.map(adj => ({
                adjustment: adj,
                error: "Portfolio has zero value",
            })),
            reason: "Portfolio value is zero",
            totalValue: 0,
        };
    }

    // 🔹 Process each adjustment
    for (let i = 0; i < adjustments.length; i++) {
        const adj = adjustments[i];
        console.log(`\n📊 Processing adjustment ${i + 1}/${adjustments.length}:`);
        console.log(`   ${adj.tokenOut} → ${adj.tokenIn} (${adj.percentage}%)`);

        try {
            // Find token allocations
            const tokenOutAllocation = findTokenAllocation(portfolio, adj.tokenOut);
            const tokenInAllocation = findTokenAllocation(portfolio, adj.tokenIn);
            const tokenOutAddresss = findTokenAddress(portfolio, adj.tokenOut);
            const tokenInAddress = findTokenAddress(portfolio, adj.tokenIn);
            if (!tokenOutAllocation) {
                throw new Error(`Token ${adj.tokenOut} not found in portfolio`);
            }
            if (!tokenInAllocation) {
                throw new Error(`Token ${adj.tokenIn} not found in portfolio`);
            }
            if (!tokenOutAddresss) {
                throw new Error(`Token ${adj.tokenOut} not found in portfolio`);
            }
            if (!tokenInAddress) {
                throw new Error(`Token ${adj.tokenIn} not found in portfolio`);
            }
            // Calculate amounts
            const amounts = calculateAmounts(
                adj,
                portfolio.allocations,
                marketData,
                totalValue
            );
            console.log(amounts,'this is amount');

            const { amountIn, amountOut, swapValue } = amounts;

            console.log(`   💱 Swap Details:`);
            console.log(`      Value: $${swapValue.toFixed(2)} (${adj.percentage}% of portfolio)`);
            console.log(`      Out: ${amountOut.toFixed(6)} ${adj.tokenOut.toUpperCase()}`);
            console.log(`      In: ${amountIn.toFixed(6)} ${adj.tokenIn.toUpperCase()}`);

            // Prepare log entry
            // const logEntry:LogEntry = {
            //     portfolioId: portfolio.id,
            //     tokenInId: tokenInAllocation.tokenId,
            //     tokenOutId: tokenOutAllocation.tokenId,
            //     amountIn: amountIn.toString(),
            //     amountOut: amountOut.toString(),
            //     reason: `${reason} - ${adj.reason || 'Rebalancing'}`,
            //     executor: bot.name,
            //     timestamp: new Date(),
            // };

            // Convert amounts to proper decimals
            const tokenOutDecimals = 18;
            const tokenInDecimals = 18;


            const amountOutWei = parseUnits(amountOut.toString(), tokenOutDecimals);
            const amountInWei = parseUnits(amountIn.toString(), tokenInDecimals);
            const minAmountInWei = parseUnits((amountIn * 0.98).toString(), tokenInDecimals);

            // Prepare rebalance parameters
            // @ts-ignore
            const rebalanceParams = {
                botAddress: bot.address,
                tokenIn: tokenInAddress,
                tokenOut: tokenOutAddresss ,
                amountOut: amountOutWei,
                amountInMin: minAmountInWei,
                swapPath: [
                    tokenOutAddresss,
                    tokenInAddress
                ],
                reason: adj.reason || reason,
            };

            console.log(`   🔄 Executing delegation redemption...`);

            // Execute the delegation/swap
            const txResult = await redeemDelegationService(smartAccountId, rebalanceParams);
            console.log('execution result', txResult);
            // Handle different return types
            let userOpHash: string;
            let transactionHash: string | undefined;

            if (typeof txResult === 'string') {
                // Fast mode: only userOpHash returned
                userOpHash = txResult;
                transactionHash = txResult; // Use userOpHash as placeholder
                console.log(`   ✅ User Operation submitted: ${userOpHash}`);
            } else {
                // Full mode: receipt with transaction hash
                userOpHash = txResult.userOpHash;
                transactionHash = txResult.transactionHash;
                console.log(`   ✅ Transaction confirmed: ${transactionHash}`);
            }

            //
            // // Add transaction info safely
            // logEntry.userOpHash = userOpHash;
            // logEntry.transactionHash = transactionHash;
            // logEntry.status = 'completed';
            //
            // successfulRebalances.push(logEntry);

        } catch (error: any) {
            console.error(`❌ Failed: ${error.message}`);
            console.error(`❌ Adjustment failed for ${adj.tokenOut} → ${adj.tokenIn}`);
            console.error(`   Reason: ${error.message}`);
            console.error(`   Stack: ${error.stack?.split("\n")[0]}`);

            failedAdjustments.push({
                adjustment: adj,
                error: error.message,
                timestamp: new Date(),
            });
        }
    }

    // 🔹 Log successful rebalances to database
    // if (successfulRebalances.length > 0) {
    //     try {
    //         await createRebalanceLog(successfulRebalances);
    //         console.log(`\n✅ Logged ${successfulRebalances.length} successful rebalance(s) to database`);
    //     } catch (error: any) {
    //         console.error(`⚠️ Failed to log rebalances to database:`, error.message);
    //     }
    // } else {
    //     console.log(`\n⚠️ No successful rebalances to log`);
    // }
    //
    // // 🔹 Prepare result
    const executedCount = successfulRebalances.length;
    const failedCount = failedAdjustments.length;
    const totalCount = executedCount + failedCount;

    let status: "success" | "partial" | "failed" | "no_adjustments";
    if (executedCount === 0) {
        status = "failed";
    } else if (failedCount === 0) {
        status = "success";
    } else {
        status = "partial";
    }

    console.log(`\n📈 Rebalance Summary:`);
    console.log(`   Total: ${totalCount}`);
    console.log(`   Successful: ${executedCount}`);
    console.log(`   Failed: ${failedCount}`);
    console.log(`   Status: ${status.toUpperCase()}`);

    return {
        status,
        executedCount,
        failedCount,
        rebalanceResults: successfulRebalances,
        failedAdjustments,
        reason,
        totalValue,
    };
}

/**
 * Calculate total portfolio value from allocations and market data
 */
function calculatePortfolioValue(portfolio: any, marketData: any): number {
    if (!portfolio.allocations || portfolio.allocations.length === 0) {
        return 0;
    }

    return portfolio.allocations.reduce((total: number, alloc: any) => {
        const tokenId = alloc.tokenId || alloc.token?.symbol?.toLowerCase();
        const price = marketData?.[tokenId]?.usd || 0;
        const amount = Number(alloc.amount || 0);

        return total + (amount * price);
    }, 0);
}

/**
 * Find token allocation in portfolio by symbol or ID
 */
function findTokenAllocation(portfolio: any, tokenSymbol: string): any {
    if (!portfolio.allocations) return null;

    const searchTerm = tokenSymbol.toLowerCase();

    return portfolio.allocations.find((alloc: any) => {
        const symbol = alloc.token?.symbol?.toLowerCase() || alloc.tokenId?.toLowerCase();
        return symbol === searchTerm;
    });
}

function findTokenAddress(portfolio: any, tokenSymbol: string): string | null {
    if (!portfolio?.allocations || !Array.isArray(portfolio.allocations)) return null;

    const searchTerm = tokenSymbol.toLowerCase();

    const allocation = portfolio.allocations.find((alloc: any) => {
        const symbol =
            alloc.token?.symbol?.toLowerCase() || alloc.tokenId?.toLowerCase();
        return symbol === searchTerm;
    });

    // Return the token's address if found
    return allocation?.token?.address || null;
}

const mar = {
    "usd-coin": {
        usd: 1,
        usd_market_cap: 76770942445.89798,
        usd_24h_vol: 21189195729.347694,
        usd_24h_change: -0.002882751937147867,
        last_updated_at: 1761126649,
    },
};
// const newbot = {'name':"Drift",'address':'0x1235aC2B678202802b5071a7AadF7efe0E172d0E'}
// const work = await executeRebalances(newbot,"f24a292e-d164-4416-b5cb-849693403d8b","1db590d1-8c8f-48ed-b383-eb12378edeb8",s,'fa',mar,120)
// console.log(work);

// const txResult = await redeemDelegationService(smartAccountId, rebalanceParams);

const txResult = await redeemDelegationService(
    "f24a292e-d164-4416-b5cb-849693403d8b",
    {
        botAddress: "0x1235aC2B678202802b5071a7AadF7efe0E172d0E",
        tokenIn: "0x2222222222222222222222222222222222222222",   // USDC address
        tokenOut: "0x3333333333333333333333333333333333333333",  // USDT address
        amountOut: BigInt("1000000000000000000"),  // 1 USDT (in wei)
        amountInMin: BigInt("980000000000000000"), // 0.98 USDC (in wei)
        swapPath: [
            "0x3333333333333333333333333333333333333333",
            "0x2222222222222222222222222222222222222222",
        ],
        reason: "hello",
    }
);

console.log(txResult);
