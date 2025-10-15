import { llmDecisionEngine } from "./bot.service.js";
import { redeemDelegationService } from "./bot.delegation.js";
import {createRebalanceLog, getPortfolioBySmartAccountId} from "../../utils/dbhelpers.js";
import { RebalanceService } from "./bot.rebalance.service.js";
import { getBotById,updateBot } from "../../utils/dbhelpers.js";
import {LLMAdjustment} from "./bot.types.js";
import {calculateAmounts} from "../../utils/oraclehelper.js";

interface MarketData {
    [id: string]: {
        usd: number;
        usd_market_cap: number;
        usd_24h_vol: number;
        usd_24h_change: number;
        last_updated_at: number;
    };
}


type AgentMode = "standard" | "smart";

export async function runAIAgent(
    botId: string,
    smartAccountId: string,
    marketData?: MarketData,
    agentMode: AgentMode = "standard"
) {
    console.log(`--Starting AI Agent for bot ID: ${botId}, SmartAccount: ${smartAccountId}--`);

    // Fetch bot info
    const bot = await getBotById(botId, true); // with decrypted private key
    if (!bot) throw new Error(`Bot with ID "${botId}" not found`);
    if (bot.status !== "active") throw new Error(`Bot "${bot.name}" is not active`);

    // Update bot status → running
    await updateBot(bot.id, { status: "running" });

    try {
        // Fetch portfolio
        const portfolio = await getPortfolioBySmartAccountId(smartAccountId);
        if (!portfolio) throw new Error("Portfolio not found for this smart account");

        const allocations = portfolio.allocations || [];
        const recentRebalances = portfolio.rebalanceLogs?.slice(0, 3) || [];

        // Compute current weights
        const totalValue = allocations.reduce((acc: number, a: any) => {
            const price = marketData?.[a.token.id]?.usd ?? 1;
            return acc + price * a.percent;
        }, 0);

        const currentWeights = allocations.map((a: any) => {
            const price = marketData?.[a.token.id]?.usd ?? 1;
            const currentPercent = (price * a.percent) / totalValue * 100;
            return {
                token: a.token.symbol,
                target: a.percent,
                current: currentPercent,
                deviation: currentPercent - a.percent,
            };
        });

        const tolerance = 5;
        const needsAdjustment = currentWeights.some((w: { deviation: number; }) => Math.abs(w.deviation) > tolerance);

        if (!needsAdjustment) {
            console.log(`🤖 [${bot.name}] Portfolio within ${tolerance}% tolerance. Skipping LLM call.`);
            return {
                status: "idle",
                reason: `All allocations within ${tolerance}% of target`,
                currentWeights,
                recentRebalances
            };
        }

        // Build LLM context
        const context = `
Portfolio: ${portfolio.name}

Allocations (Target vs Current):
${currentWeights
            .map(
                (w: { token: any; target: number; current: number; deviation: number; }) =>
                    `- ${w.token}: Target ${w.target.toFixed(2)}%, Current ${w.current.toFixed(
                        2
                    )}%, Deviation ${w.deviation.toFixed(2)}%`
            )
            .join("\n")}

Recent Rebalances:
${
            recentRebalances.length
                ? recentRebalances
                    .map((r: any) => `• In: ${r.tokenInId}, Out: ${r.tokenOutId}, Reason: ${r.reason}`)
                    .join("\n")
                : "None yet."
        }

Market Summary:
${
            marketData
                ? Object.entries(marketData)
                    .map(
                        ([id, data]) =>
                            `• ${id.toUpperCase()}: $${data.usd.toFixed(2)}`
                    )
                    .join("\n")
                : "No market data provided"
        }

Volatility (24h Change):
${
            marketData
                ? Object.entries(marketData)
                    .map(
                        ([id, data]) =>
                            `• ${id.toUpperCase()}: ${data.usd_24h_change.toFixed(2)}%`
                    )
                    .join("\n")
                : "No volatility data provided"
        }

Agent Mode: ${agentMode}
Data Timestamp: ${marketData ? new Date(Object.values(marketData)[0].last_updated_at * 1000).toISOString() : "N/A"}

Instructions:
${agentMode === "smart"
            ? "You may dynamically adjust allocations based on market conditions, but keep changes moderate (max ±10% per token)."
            : "Maintain the user's target allocations. Only rebalance if deviations exceed 5%."}
`;

        // LLM Decision
        const llmPrompt = `
You are an AI portfolio manager bot named ${bot.name}.
You are operating in **${agentMode} mode**.

Based on the data above, decide whether to:
  - "redeem": rebalance and redeem delegations.
  - "none": Do nothing (portfolio is within acceptable range)

${context}

If you decide to rebalance, specify which tokens to swap. Each adjustment should help bring allocations closer to target.
For example, if BTC is 5% over target and ETH is 5% under, swap some BTC for ETH.
`;

        const llmDecision = await llmDecisionEngine(bot.name, llmPrompt);
        const { action, reason, adjustments } = llmDecision as {
            action: string;
            reason: string;
            adjustments: LLMAdjustment[];
        };


        let result: any;

        // Handle decision
        switch (action) {
            case "none":
                console.log(`[${bot.name}] No action required. Reason: ${reason}`);
                result = { status: "idle", reason };
                break;

            case "redeem":
                console.log(`🤖 [${bot.name}] Redeeming delegations first...`);


                const redeemedRebalances = [];
                for (const adj of adjustments) {
                    try {
                        const { amountIn, amountOut, swapValue } = calculateAmounts(adj, allocations, marketData, totalValue);
                        console.log(`  ↻ Rebalancing: ${adj.tokenOutId} → ${adj.tokenInId}`);
                        console.log(`     Swap ${adj.percent}% of portfolio (${swapValue.toFixed(2)})`);
                        console.log(`     Out: ${amountOut.toFixed(6)} ${adj.tokenOutId}`);
                        console.log(`     In: ${amountIn.toFixed(6)} ${adj.tokenInId}`);
                        const res = await RebalanceService.logRebalance({
                            portfolioId: portfolio.id,
                            tokenInId: adj.tokenInId,
                            tokenOutId: adj.tokenOutId,
                            amountIn: amountIn,
                            amountOut: amountOut,
                            reason: `${reason} (redeemed first)`,
                            executor: bot.name,
                        });
                        const rebalanceParams = {
                            botAddress: bot.address,                 // The bot’s smart account or EOA
                            tokenIn: adj.tokenInId,                 // token to receive
                            tokenOut: adj.tokenOutId,               // token to sell
                            amountIn: BigInt(Math.floor(amountIn)), // in token units
                            amountOutMin: BigInt(Math.floor(amountOut * 0.98)), // 2% slippage tolerance
                            swapPath: [adj.tokenOutId, adj.tokenInId],          // simple swap path
                            reason: reason,
                        };
                        const redemptionResult = await redeemDelegationService(smartAccountId,rebalanceParams);
                        redeemedRebalances.push(res);

                    }
                    catch (error: any) {
                        console.error(`❌ Failed to process adjustment:`, error.message);
                        // Continue with other adjustments
                    }
                                  }
                // database write
                await createRebalanceLog(redeemedRebalances)
                result = {
                    status: "redeemed_and_rebalanced",
                    rebalanceResults: redeemedRebalances,
                    reason,
                };
                break;

            default:
                console.warn(`⚠️ [${bot.name}] Unknown LLM action: ${action}`);
                result = { status: "unknown", reason };
        }

        // Update bot after success
        await updateBot(bot.id, { status: "active" });

        return result;
    } catch (error: any) {
        console.error(`❌ [${bot.name}] Agent run failed:`, error.message);
        await updateBot(botId, { status: "error" });
        throw error;
    }
}
