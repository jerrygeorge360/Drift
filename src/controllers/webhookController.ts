import { Request, Response } from "express";
import { runAIAgent } from "../modules/bot/bot.agent.js";

/**
 * Webhook to trigger the AI Agent for a specific smart account.
 * The agent will decide whether to redeem, rebalance, or remain idle.
 */

export const userAgentWebhook = async (req: Request, res: Response) => {
    const { smartAccountId } = req.params;
    const { botName, marketData } = req.body;
    // marketData should include things like:
    // { prices: { "ETH": 2500, "USDC": 1 }, timestamp: "...", volatility: {...} }

    try {
        console.log(`🌐 Webhook received for SmartAccount ${smartAccountId}`);

        // Run AI agent with market data
        const result = await runAIAgent(botName || "DefaultBot", smartAccountId, marketData);

        // Respond with the agent’s decision and actions
        res.status(200).json({
            message: "AI Agent executed successfully",
            result,
        });
    } catch (error: any) {
        console.error("❌ Error in AI agent webhook:", error);
        res.status(500).json({
            message: "Failed to execute AI Agent",
            error: error.message,
        });
    }
};
