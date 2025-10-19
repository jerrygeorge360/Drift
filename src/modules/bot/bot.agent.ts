import {
    getPortfolioBySmartAccountId,
    getBotById,
    updateBot,
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

type AgentMode = "standard" | "smart";

export async function runAIAgent(
    botId: string,
    smartAccountId: string,
    marketData?: MarketData,
    agentMode: AgentMode = "standard"
) {
    console.log(`--Starting AI Agent for bot ID: ${botId}, SmartAccount: ${smartAccountId}--`);

    const bot = await getBotById(botId, true);
    if (!bot) throw new Error(`Bot with ID "${botId}" not found`);
    if (bot.status !== "active") throw new Error(`Bot "${bot.name}" is not active`);
    await updateBot(bot.id, { status: "running" });

    try {
        // 🔹 Fetch portfolio
        const portfolio = await getPortfolioBySmartAccountId(smartAccountId);
        if (!portfolio) throw new Error("Portfolio not found for this smart account");

        // 🔹 Build context directly (since queue already filters portfolios that need adjustment)
        const context = buildLLMContext(portfolio, marketData, undefined, undefined, agentMode);

        // 🔹 Let LLM decide what to do
        const { action, reason, adjustments } = await getLLMDecision(bot, context, agentMode);

        let result;
        if (action === "redeem" || action === "rebalance") {
            result = await executeRebalances(
                bot,
                smartAccountId,
                portfolio,
                adjustments,
                reason,
                marketData
            );
        } else {
            console.log(`[${bot.name}] No action required. Reason: ${reason}`);
            result = { status: "idle", reason };
        }

        // 🔹 Reset bot to active
        await updateBot(bot.id, { status: "active" });
        return result;

    } catch (error: any) {
        console.error(`❌ [${bot.name}] Agent run failed:`, error.message);
        await updateBot(botId, { status: "error" });
        throw error;
    }
}
