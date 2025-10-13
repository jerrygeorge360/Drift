import { llmDecisionEngine } from "./bot.service.js";
import { redeemDelegationService } from "./bot.delegation.js";
import { getPortfolioBySmartAccountId } from "../../utils/dbhelpers.js";
import { RebalanceService } from "./bot.rebalance.service.js";
import { getBotById,updateBot } from "../../utils/dbhelpers.js";

interface MarketData {
    prices?: Record<string, number>;
    volatility?: Record<string, number>;
    timestamp?: string;
}

type AgentMode = "standard" | "smart";

export async function runAIAgent(
    botId: string,
    smartAccountId: string,
    marketData?: MarketData,
    agentMode: AgentMode = "standard"
) {
    console.log(`🤖 Starting AI Agent for bot ID: ${botId}, SmartAccount: ${smartAccountId}`);

    // 1️⃣ Fetch bot info
    const bot = await getBotById(botId, true); // with decrypted private key
    if (!bot) throw new Error(`Bot with ID "${botId}" not found`);
    if (bot.status !== "active") throw new Error(`Bot "${bot.name}" is not active`);

    // Update bot status → running
    await updateBot(bot.id, { status: "running" });

    try {
        // 2️⃣ Fetch portfolio
        const portfolio = await getPortfolioBySmartAccountId(smartAccountId);
        if (!portfolio) throw new Error("Portfolio not found for this smart account");

        const allocations = portfolio.allocations || [];
        const recentRebalances = portfolio.rebalanceLogs?.slice(0, 3) || [];

        // Compute current weights
        const totalValue = allocations.reduce((acc: number, a: any) => {
            const price = marketData?.prices?.[a.token.symbol] ?? 1;
            return acc + price * a.percent;
        }, 0);

        const currentWeights = allocations.map((a: any) => {
            const price = marketData?.prices?.[a.token.symbol] ?? 1;
            const currentPercent = (price * a.percent) / totalValue * 100;
            return {
                token: a.token.symbol,
                target: a.percent,
                current: currentPercent,
                deviation: currentPercent - a.percent,
            };
        });

        // 3️⃣ Build LLM context
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
            marketData?.prices
                ? Object.entries(marketData.prices)
                    .map(([symbol, price]) => `• ${symbol}: $${price}`)
                    .join("\n")
                : "No market data provided"
        }

Volatility:
${
            marketData?.volatility
                ? Object.entries(marketData.volatility)
                    .map(([symbol, vol]) => `${symbol}: ${vol.toFixed(2)}%`)
                    .join("\n")
                : "No volatility data provided"
        }

Agent Mode: ${agentMode}
Data Timestamp: ${marketData?.timestamp || "N/A"}
`;

        // 4️⃣ LLM Decision
        const llmPrompt = `
You are an AI portfolio manager bot named ${bot.name}.
You are operating in **${agentMode} mode**.

- In **standard mode**, maintain the user's target allocations.
- In **smart mode**, you may slightly adjust targets dynamically based on volatility or price movement.

Based on the data, decide whether to:
  - "redeem" delegations and then rebalance,
  - "rebalance" directly, or
  - "none" (do nothing).

Return ONLY valid JSON:
{
  "action": "redeem" | "rebalance" | "none",
  "reason": "string explanation",
  "adjustments": [
    {
      "tokenInId": "string",
      "tokenOutId": "string",
      "percent": number
    }
  ]?
}

Context:
${context}
`;

        const llmDecision = await llmDecisionEngine(bot.name, llmPrompt);
        const { action, reason, adjustments = [] } = llmDecision;

        let result: any;

        // 5️⃣ Handle decision
        switch (action) {
            case "none":
                console.log(`🤖 [${bot.name}] No action required. Reason: ${reason}`);
                result = { status: "idle", reason };
                break;

            case "redeem":
                console.log(`🤖 [${bot.name}] Redeeming delegations first...`);
                const redemptionResult = await redeemDelegationService(smartAccountId);

                const redeemedRebalances = [];
                for (const adj of adjustments) {
                    const res = await RebalanceService.logRebalance({
                        portfolioId: portfolio.id,
                        tokenInId: adj.tokenInId,
                        tokenOutId: adj.tokenOutId,
                        amountIn: adj.percent,
                        amountOut: adj.percent,
                        reason: `${reason} (redeemed first)`,
                        executor: bot.name,
                    });
                    redeemedRebalances.push(res);
                }

                result = {
                    status: "redeemed_and_rebalanced",
                    redemptionResult,
                    rebalanceResults: redeemedRebalances,
                    reason,
                };
                break;

            case "rebalance":
                console.log(`🤖 [${bot.name}] Performing rebalances directly...`);
                const rebalances = [];

                for (const adj of adjustments) {
                    const res = await RebalanceService.logRebalance({
                        portfolioId: portfolio.id,
                        tokenInId: adj.tokenInId,
                        tokenOutId: adj.tokenOutId,
                        amountIn: adj.percent,
                        amountOut: adj.percent,
                        reason,
                        executor: bot.name,
                    });
                    rebalances.push(res);
                }

                result = { status: "rebalanced", rebalanceResults: rebalances, reason };
                break;

            default:
                console.warn(`⚠️ [${bot.name}] Unknown LLM action: ${action}`);
                result = { status: "unknown", reason };
        }

        // ✅ Update bot after success
        await updateBot(bot.id, { status: "active" });

        return result;
    } catch (error: any) {
        console.error(`❌ [${bot.name}] Agent run failed:`, error.message);
        await updateBot(botId, { status: "error" });
        throw error;
    }
}
