import {
    getPortfolioBySmartAccountId,
    updateBot, getBotByName,
} from "../../utils/dbhelpers.js";

import { buildLLMContext } from "./bot.context.js";
import { getLLMDecision } from "./bot.decision.js";
import { executeRebalances } from "./bot.execution.js";
export interface MarketData {
    [id: string]: {
        usd: number;
        usd_market_cap: number;
        usd_24h_vol: number;
        usd_24h_change: number;
        last_updated_at: number;
    };
}

// Fixed: Align with queue validation
export type AgentMode = "auto" | "manual" | "test" | "smart" | "urgent";

/**
 * Main AI Agent runner
 * @param botName
 * @param smartAccountId - Smart account to process
 * @param marketData - Current market data
 * @param agentMode - Mode of operation (defaults to 'auto')
 * @param currentWeights
 * @param recentRebalances
 * @param totalValue
 */
export async function runAIAgent(
    botName: string,
    smartAccountId: string,
    delegationId:string,
    marketData?: MarketData,
    agentMode: AgentMode = "auto",
    currentWeights?: any,
    recentRebalances?: any,
    totalValue?: any
) {
    console.log(`--Starting AI Agent for bot ID: ${botName}, SmartAccount: ${smartAccountId}--`);
    console.log(`Mode: ${agentMode}`);

    // Validate inputs
    if (!botName || !smartAccountId) {
        throw new Error("botName and smartAccountId are required");
    }

    const bot = await getBotByName(botName, true);
    if (!bot) throw new Error(`Bot with ID "${botName}" not found`);
    if (bot.status !== "active") {
        throw new Error(`Bot "${bot.name}" is not active (current status: ${bot.status})`);
    }

    // Update bot status with error handling
    try {
        await updateBot(bot.name, { status: "running" });
    } catch (error: any) {
        console.error(`Failed to update bot status to running:`, error.message);
        throw error;
    }

    try {
        // Fetch portfolio
        const portfolio = await getPortfolioBySmartAccountId(smartAccountId);
        if (!portfolio) {
            throw new Error(`Portfolio not found for smart account: ${smartAccountId}`);
        }

        console.log(`Portfolio loaded: ${portfolio.allocations?.length || 0} allocations`);

        // Build context (will auto-calculate weights if not provided)
        const context = buildLLMContext(
            portfolio,
            marketData,
            currentWeights,
            recentRebalances,
            totalValue,
            agentMode
        );

        console.log(`Requesting LLM decision for ${bot.name}...`);

        // Let LLM decide what to do
        const { action, reason, adjustments } = await getLLMDecision(
            bot,
            context,
            agentMode
        );

        console.log(`LLM Decision: ${action}`);
        console.log(`Reason: ${reason}`);

        if (adjustments && adjustments.length > 0) {
            console.log(`Adjustments: ${adjustments.length} planned`);
            adjustments.forEach((adj, idx) => {
                console.log(`   ${idx + 1}. ${adj.tokenOut} → ${adj.tokenIn} (${adj.percentage}%)`);
            });
        }

        let result;

        if (action === "rebalance") {
            console.log(`Executing rebalance with ${adjustments?.length || 0} adjustments...`);

            result = await executeRebalances(
                bot,
                delegationId,
                portfolio,
                adjustments,
                reason,
                marketData,
                totalValue
            );

            console.log(`\nExecution Summary:`, {
                status: result.status,
                executed: result.executedCount,
                failed: result.failedCount,
            });

            // Add more context to result
            result = {
                ...result,
                action: "rebalance",
                botId: bot.id,
                botName: bot.name,
                smartAccountId,
                agentMode,
                timestamp: new Date().toISOString(),
            };

        } else {
            console.log(`[${bot.name}] No action required. Reason: ${reason}`);
            result = {
                status: "idle",
                reason,
                action,
                botId: bot.id,
                botName: bot.name,
                smartAccountId,
                agentMode,
                timestamp: new Date().toISOString(),
            };
        }

        // Reset bot to active
        await updateBot(bot.name, { status: "active" });

        return {
            ...result,
            botId: bot.id,
            botName: bot.name,
            smartAccountId,
            agentMode,
        };

    } catch (error: any) {
        console.error(` [${bot.name}] Agent run failed:`, error.message);
        console.error(error.stack);

        // Better error handling for status update
        try {
            await updateBot(botName, { status: "error" });
        } catch (updateError: any) {
            console.error(`Failed to update bot status to error:`, updateError.message);
        }

        // Re-throw with more context
        throw new Error(`AI Agent failed for bot ${botName}: ${error.message}`);
    }
}