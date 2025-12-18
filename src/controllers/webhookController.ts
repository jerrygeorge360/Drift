import { Request, Response } from "express";
import db from "../config/db.js";
import { mapPortfolio } from "../modules/rebalancer/rebalancer.service.js";
import { rebalancePortfolio } from "../modules/rebalancer/rebalancer.rules.js";
import { RedeemResult } from "../modules/delegation/types.js";
import { redeemDelegationService } from "../modules/bot/bot.delegation.js";
import { getDelegationBySmartAccountId } from "../utils/dbhelpers.js";


/**
 * Webhook to trigger rebalancing.
 */
export const userAgentWebhook = async (req: Request, res: Response) => {
    const { botName, marketData } = req.body;
    console.log(marketData);
    console.log('reached marketdata')


    try {

        if (!marketData) {
            return res.status(400).json({
                message: "Missing required field: marketData"
            });
        }




        // Save market data to DB (Cache for API and would be used for the snapshots for the ai agent)
        if (marketData) {
            try {
                console.log('Saving market data to DB...');
                const updates = Object.entries(marketData).map(([symbol, data]: [string, any]) => {
                    return db.tokenPrice.create({
                        data: {
                            symbol,
                            usdPrice: data.usd,
                            usdMarketCap: data.usd_market_cap,
                            usd24hVol: data.usd_24h_vol,
                            usd24hChange: data.usd_24h_change,
                            lastUpdatedAt: new Date()
                        }
                    });
                });
                await Promise.all(updates);
                console.log('Market data saved to DB');
            } catch (dbError: any) {
                console.error('Failed to save market data to DB:', dbError.message);
                // Don't fail the request, just log it
            }
        }

        // Step 1: Fetch all smart accounts with portfolios + allocations
        console.log('Fetching smart accounts with portfolios...');
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
                    },
                },
            },
        });

        const prices: Record<string, number> = {};
        const health: Record<string, any> = {};

        if (marketData) {
            for (const [symbol, data] of Object.entries(marketData)) {
                prices[symbol] = (data as any).usd;
            }
        }

        let accountsProcessed = 0;
        let tradesExecuted = 0;
        let tradesFailed = 0;

        for (const account of smartAccounts) {
            const portfolio = account.portfolio;
            if (!portfolio) continue;
            accountsProcessed++;

            const input = mapPortfolio(portfolio as any);

            const result = await rebalancePortfolio(input, prices, undefined, 0.05);

            console.log(`Portfolio ${portfolio.id} decision:`, result.action);

            if (result.action === "REBALANCE") {
                const smartAccountIdWithPortfolio = portfolio.smartAccountId;

                // 1. Get the delegation
                const delegation = await getDelegationBySmartAccountId(smartAccountIdWithPortfolio);
                if (!delegation) continue;

                if (delegation.expiresAt && delegation.expiresAt < new Date()) continue;
                if (delegation.revoked) continue;

                // 2. Execute each rebalance trade
                for (const params of result.params) {
                    try {
                        const txResult: RedeemResult = await redeemDelegationService(delegation.id, params);
                        console.log(`Executed trade: ${params.tokenIn} → ${params.tokenOut}`, txResult);
                        tradesExecuted++;
                    } catch (err: any) {
                        console.error(`Failed to execute trade ${params.tokenIn} → ${params.tokenOut}:`, err.message);
                        tradesFailed++;
                    }
                }
            }
        }

        return res.status(200).json({
            message: "Rebalancing process completed",
            summary: {
                accountsProcessed,
                tradesExecuted,
                tradesFailed
            }
        });

    } catch (error: any) {
        console.error("Webhook error:", error.message);
        return res.status(500).json({
            message: "Internal server error during rebalancing",
            error: error.message
        });
    }
};