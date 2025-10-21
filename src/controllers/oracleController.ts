import { Request, Response } from 'express';
import {
    startPricePolling,
    stopPricePolling,
    restartPricePolling,
    getCurrentPrices,
    getMarketDataForBot,
    getMarketDataForTokens,
    isMarketDataFresh,
    getPollingStatus,
    updateIntervals,
    forceUpdate,
    triggerWebhook
} from '../utils/oracle.service.js';

class PricePollingController {
    /**
     * Get polling status and statistics
     */
    getStatus(req: Request, res: Response) {
        try {
            const status = getPollingStatus();
            res.json({
                success: true,
                data: status
            });
        } catch (error: any) {
            res.status(500).json({
                success: false,
                message: 'Failed to get polling status',
                error: error.message
            });
        }
    }

    /**
     * Start the polling service
     */
    startPolling(req: Request, res: Response) {
        try {
            startPricePolling();

            res.json({
                success: true,
                message: 'Price polling service started successfully'
            });
        } catch (error: any) {
            res.status(500).json({
                success: false,
                message: 'Failed to start polling service',
                error: error.message
            });
        }
    }

    /**
     * Stop the polling service
     */
    stopPolling(req: Request, res: Response) {
        try {
            stopPricePolling();
            res.json({
                success: true,
                message: 'Price polling service stopped successfully'
            });
        } catch (error: any) {
            res.status(500).json({
                success: false,
                message: 'Failed to stop polling service',
                error: error.message
            });
        }
    }

    /**
     * Restart the polling service
     */
    restartPolling(req: Request, res: Response) {
        try {
            restartPricePolling();
            res.json({
                success: true,
                message: 'Price polling service restarted successfully'
            });
        } catch (error: any) {
            res.status(500).json({
                success: false,
                message: 'Failed to restart polling service',
                error: error.message
            });
        }
    }

    /**
     * Get current prices (simple format)
     */
    getPrices(req: Request, res: Response) {
        try {
            const prices = getCurrentPrices();
            const isFresh = isMarketDataFresh();

            res.json({
                success: true,
                data: prices,
                metadata: {
                    fresh: isFresh,
                    warning: !isFresh ? 'Price data may be stale' : undefined
                }
            });
        } catch (error: any) {
            res.status(500).json({
                success: false,
                message: 'Failed to get prices',
                error: error.message
            });
        }
    }

    /**
     * Get market data for bot (full format with market cap, volume, 24h change)
     */
    getMarketData(req: Request, res: Response) {
        try {
            const { tokens } = req.query;

            let marketData;

            // If specific tokens requested, filter
            if (tokens && typeof tokens === 'string') {
                const tokenArray = tokens.split(',').map(t => t.trim());
                marketData = getMarketDataForTokens(tokenArray);
            } else {
                // Otherwise return all tokens
                marketData = getMarketDataForBot();
            }

            const isFresh = isMarketDataFresh();

            res.json({
                success: true,
                data: marketData,
                metadata: {
                    fresh: isFresh,
                    tokenCount: Object.keys(marketData).length,
                    warning: !isFresh ? 'Market data may be stale (>5 minutes old)' : undefined
                }
            });
        } catch (error: any) {
            res.status(500).json({
                success: false,
                message: 'Failed to get market data',
                error: error.message
            });
        }
    }

    /**
     * Update polling intervals
     */
    updateIntervals(req: Request, res: Response) {
        try {
            const { allSeconds } = req.body;

            updateIntervals(allSeconds);

            res.json({
                success: true,
                message: 'Polling intervals updated. Restart the service for changes to take effect.',
                data: {
                    allSeconds: allSeconds,
                }
            });
        } catch (error: any) {
            res.status(400).json({
                success: false,
                message: 'Failed to update intervals',
                error: error.message
            });
        }
    }

    /**
     * Force immediate price update
     */
    async forceUpdate(req: Request, res: Response) {
        try {
            const prices = await forceUpdate();

            res.json({
                success: true,
                message: 'Prices updated successfully',
                data: prices
            });
        } catch (error: any) {
            res.status(500).json({
                success: false,
                message: 'Failed to force update',
                error: error.message
            });
        }
    }

    async triggerWebhook(req: Request, res: Response) {
        try {
            const { webhookUrl, botName } = req.body;

            if (!webhookUrl || !botName) {
                return res.status(400).json({
                    success: false,
                    message: 'webhookUrl and botName are required fields'
                });
            }

            await triggerWebhook(webhookUrl, botName);

            res.json({
                success: true,
                message: `Webhook triggered successfully for bot: ${botName}`,
                webhookUrl
            });
        } catch (error: any) {
            res.status(500).json({
                success: false,
                message: 'Failed to trigger webhook',
                error: error.message
            });
        }
    }
}

export default new PricePollingController();