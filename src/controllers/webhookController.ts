import { Request, Response } from "express";
import db from "../config/db.js";
import { mapPortfolio } from "../modules/rebalancer/rebalancer.service.js";
import { rebalancePortfolio } from "../modules/rebalancer/rebalancer.rules.js";
import { RedeemResult } from "../modules/delegation/types.js";
import { redeemDelegationService } from "../modules/bot/bot.delegation.js";
import { getDelegationBySmartAccountId } from "../utils/dbhelpers.js";
import { logger } from "../utils/logger.js";
import { syncPortfolioBalances, getSpotPriceFromRouter } from "../utils/blockchainhelpers.js";


/**
 * Webhook to trigger rebalancing.
 */
export const userAgentWebhook = async (req: Request, res: Response) => {
    const { botName, marketData } = req.body;
    logger.debug('marketData received');


    try {

        if (!marketData) {
            return res.status(400).json({
                message: "Missing required field: marketData"
            });
        }




        // Save market data to DB (Cache for API and would be used for the snapshots for the ai agent)
        if (marketData) {
            try {
                logger.info('Saving market data to DB...');
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
                logger.info('Market data saved to DB');
            } catch (dbError: any) {
                logger.error('Failed to save market data to DB', dbError);
                // Don't fail the request, just log it
            }
        }

        // Step 1: Fetch all smart accounts with portfolios + allocations
        logger.info('Fetching smart accounts with portfolios...');
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

        if (smartAccounts.length === 0) {
            logger.info('No smart accounts found with active portfolios and allocations. Skipping rebalancing.');
        } else {
            logger.info(`Fetched ${smartAccounts.length} smart accounts with portfolios and allocations`);
        }

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

            // Sync on-chain balances to DB before rebalancing
            try {
                await syncPortfolioBalances(
                    account.address,
                    portfolio.id,
                    portfolio.allocations
                );

                // Refresh the portfolio object from DB after sync
                const updatedPortfolio = await db.portfolio.findUnique({
                    where: { id: portfolio.id },
                    include: { allocations: { include: { token: true } } }
                });

                if (!updatedPortfolio) continue;

                // 2. Determine Price Source (Oracle vs Router)
                const priceSource = process.env.PRICE_SOURCE || 'ORACLE';
                const spotPrices: Record<string, number> = { ...prices }; // Default to Oracle prices

                if (priceSource === 'ROUTER') {
                    // Get USDC from the database as the base token (not from user's portfolio)
                    const baseToken = await db.token.findUnique({ where: { symbol: 'USDC' } });

                    if (baseToken && updatedPortfolio.portfolioAddress) {
                        logger.info(`Using ROUTER price source. Fetching spot prices relative to ${baseToken.symbol}`);
                        for (const alloc of updatedPortfolio.allocations) {
                            if (alloc.token.symbol === baseToken.symbol) {
                                spotPrices[alloc.token.symbol] = 1.0;
                            } else {
                                const spotPrice = await getSpotPriceFromRouter(
                                    updatedPortfolio.portfolioAddress as `0x${string}`,
                                    alloc.token.address as `0x${string}`,
                                    alloc.token.decimals,
                                    baseToken.address as `0x${string}`,
                                    baseToken.decimals
                                );
                                if (spotPrice > 0) {
                                    logger.debug(`Spot price for ${alloc.token.symbol}: ${spotPrice} (Oracle fallback: ${prices[alloc.token.symbol]})`);
                                    spotPrices[alloc.token.symbol] = spotPrice;
                                }
                            }
                        }
                    } else {
                        logger.warn("PRICE_SOURCE is set to ROUTER but USDC token not found in database or no portfolio address. Falling back to ORACLE.");
                    }
                } else {
                    logger.info("Using ORACLE price source (CoinGecko).");
                }

                const input = mapPortfolio(updatedPortfolio as any);
                
                // Check for cooldown period - prevent rebalancing within 15 minutes
                const cooldownMinutes = 15;
                const lastRebalance = await db.rebalanceLog.findFirst({
                    where: { 
                        portfolioId: portfolio.id,
                        status: 'success', // Only consider successful rebalances for cooldown
                    },
                    orderBy: { createdAt: 'desc' }
                });

                if (lastRebalance) {
                    const timeSinceLastRebalance = Date.now() - lastRebalance.createdAt.getTime();
                    const cooldownPeriod = cooldownMinutes * 60 * 1000; // Convert to milliseconds
                    
                    if (timeSinceLastRebalance < cooldownPeriod) {
                        const minutesRemaining = Math.ceil((cooldownPeriod - timeSinceLastRebalance) / (60 * 1000));
                        logger.info(`Portfolio ${portfolio.id} in cooldown period. Last rebalance: ${lastRebalance.createdAt.toISOString()}. ${minutesRemaining} minutes remaining.`);
                        continue; // Skip this portfolio
                    }
                }
                
                const result = await rebalancePortfolio(input, spotPrices, undefined, 0.15); // 15% threshold for testnet

                logger.info(`Portfolio ${portfolio.id} decision: ${result.action}`);

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
                            logger.info(`Executed trade: ${params.tokenIn} → ${params.tokenOut}`);
                            
                            // Save transaction result to database
                            try {
                                // Get token details from addresses
                                const tokenIn = await db.token.findUnique({
                                    where: { address: params.tokenIn }
                                });
                                const tokenOut = await db.token.findUnique({
                                    where: { address: params.tokenOut }
                                });

                                if (tokenIn && tokenOut) {
                                    await db.rebalanceLog.create({
                                        data: {
                                            portfolioId: portfolio.id,
                                            tokenInId: tokenIn.id,
                                            tokenOutId: tokenOut.id,
                                            amountIn: Number(params.amountIn) / Math.pow(10, tokenIn.decimals), // Convert from wei
                                            amountOut: Number(params.amountOutMin || 0) / Math.pow(10, tokenOut.decimals), // Convert from wei
                                            reason: params.reason || "Automated rebalancing",
                                            executor: params.botAddress,
                                            userOpHash: txResult.userOpHash,
                                            transactionHash: txResult.transactionHash,
                                            blockNumber: txResult.blockNumber,
                                            status: txResult.status,
                                            gasUsed: txResult.gasUsed,
                                            driftPercentage: result.maxDrift || 0   
                                        }
                                    });
                                    logger.info("✅ Rebalance log saved to database");
                                } else {
                                    logger.warn("⚠️ Could not find tokens in database, skipping log save");
                                }
                            } catch (dbError: any) {
                                logger.error("⚠️ Failed to save rebalance log to database:", dbError);
                                // Don't fail the entire request if DB save fails
                            }

                            tradesExecuted++;
                          
                        } catch (err: any) {
                            logger.error(`Failed to execute trade ${params.tokenIn} → ${params.tokenOut}`, err);
                            
                            // Save failed transaction to database
                            try {
                                const tokenIn = await db.token.findUnique({
                                    where: { address: params.tokenIn }
                                });
                                const tokenOut = await db.token.findUnique({
                                    where: { address: params.tokenOut }
                                });

                                if (tokenIn && tokenOut) {
                                    await db.rebalanceLog.create({
                                        data: {
                                            portfolioId: portfolio.id,
                                            tokenInId: tokenIn.id,
                                            tokenOutId: tokenOut.id,
                                            amountIn: Number(params.amountIn) / Math.pow(10, tokenIn.decimals),
                                            amountOut: 0,
                                            reason: (params.reason ? params.reason + ' - ' : '') + `Failed automated rebalancing: ${err.message}`,
                                            executor: params.botAddress,
                                            status: "failed",
                                        }
                                    });
                                    logger.info("❌ Failed rebalance log saved to database");
                                }
                            } catch (dbError: any) {
                                logger.error("⚠️ Failed to save failed rebalance log:", dbError);
                            }

                            tradesFailed++;
                        }
                    }
                }
            } catch (err: any) {
                logger.error(`Error processing account ${account.address}:`, err);
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
        logger.error("Webhook error", error);
        return res.status(500).json({
            message: "Internal server error during rebalancing",
            error: error.message
        });
    }
};