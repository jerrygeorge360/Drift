// controllers/PricePollingController.ts
import { Request, Response } from 'express';
import {
    getCurrentPrices,
    startPricePolling,
    stopPricePolling,
    restartPricePolling,
    getPollingStatus,
    updateIntervals,
    forceUpdate
} from "../utils/oracle.service.js";

class PricePollingController {

    /**
     * GET /api/admin/price-polling/status
     * Get current polling status
     */
    static getStatus(req: Request, res: Response): void {
        try {
            const status = getPollingStatus();
            res.json({
                success: true,
                data: status
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Failed to fetch status',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }

    /**
     * POST /api/admin/price-polling/start
     * Start the polling service
     */
    static startPolling(req: Request, res: Response): void {
        try {
            startPricePolling();
            res.json({
                success: true,
                message: 'Price polling service started successfully'
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Failed to start polling service',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }

    /**
     * POST /api/admin/price-polling/stop
     * Stop the polling service
     */
    static stopPolling(req: Request, res: Response): void {
        try {
            stopPricePolling();
            res.json({
                success: true,
                message: 'Price polling service stopped successfully'
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Failed to stop polling service',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }

    /**
     * POST /api/admin/price-polling/restart
     * Restart the polling service
     */
    static restartPolling(req: Request, res: Response): void {
        try {
            restartPricePolling();
            res.json({
                success: true,
                message: 'Price polling service restarting...'
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Failed to restart polling service',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }

    /**
     * GET /api/admin/price-polling/prices
     * Get current cached prices
     */
    static getPrices(req: Request, res: Response): void {
        try {
            const prices = getCurrentPrices();
            const status = getPollingStatus();

            res.json({
                success: true,
                data: {
                    prices,
                    lastUpdate: status.lastPriceUpdate,
                    cacheAge: status.lastPriceUpdate
                        ? Math.floor((Date.now() - status.lastPriceUpdate.getTime()) / 1000)
                        : null
                }
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Failed to fetch prices',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }

    /**
     * POST /api/admin/price-polling/intervals
     * Update polling intervals (requires restart to take effect)
     */
    static updateIntervals(req: Request, res: Response): void {
        const { volatileInterval, stableInterval } = req.body;

        try {
            updateIntervals(volatileInterval, stableInterval);

            res.json({
                success: true,
                message: 'Intervals updated. Restart polling service for changes to take effect.',
                data: getPollingStatus()
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error instanceof Error ? error.message : 'Invalid interval values'
            });
        }
    }

    /**
     * POST /api/admin/price-polling/force-update
     * Force an immediate price update
     */
    static async forceUpdate(req: Request, res: Response): Promise<void> {
        try {
            const prices = await forceUpdate();

            res.json({
                success: true,
                message: 'Prices updated successfully',
                data: prices
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Failed to force update',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }
}

export default PricePollingController;