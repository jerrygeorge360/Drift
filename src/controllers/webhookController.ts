import { Request, Response } from "express";
import { addAgentJob} from "../modules/jobs/agentQueue.js";
import { analyzePortfolio } from "../modules/bot/bot.analyze.js";
import db from "../config/db.js";




/**
 * Webhook to trigger AI Agents across all portfolios.
 * It analyzes each portfolio and enqueues only those that need rebalancing.
 */
export const userAgentWebhook = async (req: Request, res: Response) => {
    const { botName, marketData, agentMode } = req.body;
    console.log(marketData);
    console.log('reached marketdata')


    try {

        if (!marketData) {
            return res.status(400).json({
                message: "Missing required field: marketData"
            });
        }

        // Validate agentMode if provided
        const validModes = ['auto', 'manual', 'test', 'smart', 'urgent'];
        const mode = agentMode || 'auto'; // Default to 'auto'

        if (!validModes.includes(mode)) {
            return res.status(400).json({
                message: `Invalid agentMode. Must be one of: ${validModes.join(', ')}`
            });
        }

        // Step 1: Fetch all smart accounts with portfolios + allocations
        console.log('🔍 Fetching smart accounts with portfolios...');
        const smartAccounts = await db.smartAccount.findMany({
            where: {
                portfolio: {
                    allocations: { some: {} }
                },
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
            return res.status(404).json({
                message: "No smart accounts found with portfolios or portfolio allocations "
            });
        }

        console.log(`📊 Found ${smartAccounts.length} smart accounts`);

        const analysisList: {
            accountId: string;
            currentWeights: any;
            totalValue: any;
            needsAdjustment: boolean;
            recentRebalances: any;
        }[] = [];

        // Step 2: Analyze each portfolio using your AI analyzer
        const actionableAccounts = smartAccounts.filter((account) => {
            try {
                const analysis = analyzePortfolio(account.portfolio, marketData);
                analysisList.push({
                    ...analysis,
                    accountId: account.id,
                });
                console.log(analysis)
                return analysis.needsAdjustment;
            } catch (error: any) {
                console.error(`⚠️ Error analyzing account ${account.id}:`, error.message);
                return false; // Skip accounts that fail analysis
            }
        });

        if (!actionableAccounts.length) {
            return res.status(200).json({
                message: "✅ All portfolios are within tolerance. No jobs queued.",
                totalAnalyzed: smartAccounts.length,
                actionable: 0,
            });
        }

        console.log(`🎯 ${actionableAccounts.length} accounts need rebalancing`);


        // Step 3: Queue jobs using the helper function for consistency
        const queuedJobs: { jobId: string | undefined; smartAccountId: string; }[] = [];
        const failedJobs: { smartAccountId: string; error: any; }[] = [];
        console.log('queued jobs',queuedJobs);
        console.log('failed jobs',failedJobs);

        for (const account of actionableAccounts) {
            try {

                const analysis = analysisList.find(a => a.accountId === account.id);
                if (!analysis) {
                    console.warn(`⚠️ No analysis found for account ${account.id}`);
                    continue;
                }


                const job = await addAgentJob(
                    botName || "Drift", // default bot if not provided
                    account.id,
                    marketData,
                    mode,
                    analysis.currentWeights,
                    analysis.recentRebalances,
                    analysis.totalValue
                );

                queuedJobs.push({
                    jobId: job.id,
                    smartAccountId: account.id,
                });

                console.log(`📩 Enqueued job #${job.id} for SmartAccount ${account.id}`);
            } catch (error: any) {
                console.error(`❌ Failed to enqueue job for account ${account.id}:`, error.message);
                failedJobs.push({
                    smartAccountId: account.id,
                    error: error.message,
                });
            }
        }

        console.log(queuedJobs)
        // Step 4: Respond with detailed results
        const response: any = {
            message: `Successfully queued ${queuedJobs.length} AI Agent jobs`,
            summary: {
                totalAccounts: smartAccounts.length,
                analyzed: smartAccounts.length,
                needsRebalancing: actionableAccounts.length,
                queued: queuedJobs.length,
                failed: failedJobs.length,
            },
            queuedJobs,
        };

        // Include failed jobs if any
        if (failedJobs.length > 0) {
            response.failedJobs = failedJobs;
            response.message += ` (${failedJobs.length} failed)`;
        }

        // Return 207 Multi-Status if some jobs failed, otherwise 202 Accepted
        const statusCode = failedJobs.length > 0 ? 207 : 202;
        console.log(response)
        res.status(statusCode).json(response);

    } catch (error: any) {
        console.error("❌ Webhook processing failed:", error.message);
        console.error(error.stack);

        res.status(500).json({
            message: "Failed to process webhook and queue AI agent jobs",
            error: error.message,
            timestamp: new Date().toISOString(),
        });
    }
};