import { llmDecisionEngine } from "./bot.service.js";
import { redeemDelegationService } from "./bot.delegation.js";
import { getPortfolioBySmartAccountId } from "../../utils/dbhelpers.js";
import { RebalanceService } from "./bot.rebalance.service.js";

/**
 * Run the AI agent to analyze a user's portfolio and decide what to do
 * (redeem + rebalance, rebalance only, or idle)
 */
export async function runAIAgent(botName: string, smartAccountId: string) {
    console.log(`🤖 [${botName}] Starting AI agent for SmartAccount ${smartAccountId}...`);

    // 1️⃣ Fetch portfolio context
    const portfolio = await getPortfolioBySmartAccountId(smartAccountId);
    if (!portfolio) throw new Error("Portfolio not found for this smart account");

    const context = `
  Portfolio name: ${portfolio.name}
  Allocations: ${portfolio.allocations
        .map((a: any) => `${a.token.symbol}: ${a.percent}%`)
        .join(", ")}
  Recent rebalances: ${portfolio.rebalanceLogs
        .slice(0, 3)
        .map(
            (r: any) =>
                `In: ${r.tokenInId}, Out: ${r.tokenOutId}, Reason: ${r.reason}`
        )
        .join("; ")}
  Market Summary: (Price oracle data placeholder)
  `;

    // 2️⃣ Ask the LLM for reasoning and decision
    const llmDecision = await llmDecisionEngine(
        botName,
        `
    Given this portfolio and market conditions,
    decide if the bot should **redeem delegations (and rebalance)**, **rebalance directly**, or **do nothing**.
    Always respond in valid JSON format:
    {
      "action": "redeem" | "rebalance" | "none",
      "reason": "string explanation",
      "tokenInId": "string?",
      "tokenInId": "string?",
      "percentChange": number?
    }
    Context: ${context}
    `
    );

    const { action, reason, tokenInId, tokenOutId, percentChange } = llmDecision;

    // 3️⃣ Handle decision
    switch (action) {
        case "none":
            console.log(`🤖 [${botName}] No action required. Reason: ${reason}`);
            return { status: "idle", reason };

        case "redeem":
            console.log(`🤖 [${botName}] Redeeming delegations before rebalancing... Reason: ${reason}`);
            const redemptionResult = await redeemDelegationService(smartAccountId);

            // After redeeming → perform rebalance
            const rebalanceAfterRedeem = await RebalanceService.logRebalance({
                portfolioId: portfolio.id,
                tokenInId: tokenInId,
                tokenOutId: tokenOutId,
                amountIn: percentChange ?? 0,
                amountOut: percentChange ?? 0,
                reason: `${reason} (redeemed first)`,
                executor: botName,
            });

            return {
                status: "redeemed_and_rebalanced",
                redemptionResult,
                rebalanceResult: rebalanceAfterRedeem,
                reason,
            };

        case "rebalance":
            console.log(`🤖 [${botName}] Performing direct rebalance. Reason: ${reason}`);
            const rebalanceResult = await RebalanceService.logRebalance({
                portfolioId: portfolio.id,
                tokenInId: tokenInId,
                tokenOutId: tokenOutId,
                amountIn: percentChange ?? 0,
                amountOut: percentChange ?? 0,
                reason,
                executor: botName,
            });
            return { status: "rebalanced", result: rebalanceResult, reason };

        default:
            console.warn(`⚠️ [${botName}] Unknown LLM action: ${action}`);
            return { status: "unknown", reason };
    }
}
