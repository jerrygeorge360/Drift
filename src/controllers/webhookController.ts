import { Request, Response } from "express";
import { agentQueue } from "../modules/jobs/agentQueue.js";
import { analyzePortfolio } from "../modules/bot/bot.analyze.js"; // adjust path
import db  from "../config/db.js";

/**
 * Webhook to trigger AI Agents across all portfolios.
 * It analyzes each portfolio and enqueues only those that need rebalancing.
 */
export const userAgentWebhook = async (req: Request, res: Response) => {
    const { botName, marketData, agentMode } = req.body;

    try {
        // Step 1: Fetch all smart accounts with portfolios + allocations
        const smartAccounts = await db.smartAccount.findMany({
            where: {
                portfolio: { allocations: { some: {} } },
            },
            include: {
                portfolio: {
                    include: {
                        allocations: { include: { token: true } },
                        rebalanceLogs: true,
                    },
                },
            },
        });

        if (!smartAccounts.length) {
            return res.status(404).json({ message: "No smart accounts found with portfolios" });
        }

        // Step 2: Analyze each portfolio using your AI analyzer
        const actionableAccounts = smartAccounts.filter((account: { portfolio: any; }) => {
            const analysis = analyzePortfolio(account.portfolio, marketData);
            return analysis.needsAdjustment;
        });

        if (!actionableAccounts.length) {
            return res.status(200).json({
                message: "✅ All portfolios are within tolerance. No jobs queued.",
            });
        }

        // Step 3: Queue jobs for only those accounts that need rebalancing
        for (const account of actionableAccounts) {
            await agentQueue.add("run-agent", {
                smartAccountId: account.id,
                botName: botName || "alpha", // default bot if not provided
                marketData,
                agentMode: agentMode || "standard",
            });
            console.log(`📩 Enqueued job for SmartAccount ${account.id} (${botName || "alpha"})`);
        }

        // Step 4: Respond quickly
        res.status(202).json({
            message: `Queued ${actionableAccounts.length} AI Agent jobs successfully.`,
            data: actionableAccounts.map((a: { id: any; }) => a.id),
        });
    } catch (error: any) {
        console.error("❌ Webhook enqueue failed:", error.message);
        res.status(500).json({
            message: "Failed to queue AI agent jobs",
            error: error.message,
        });
    }
};
