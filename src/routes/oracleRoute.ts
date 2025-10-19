import { Router } from 'express';
import PricePollingController from "../controllers/oracleController.js";

const oracleRouter = Router();

// Get polling status
oracleRouter.get('/status', PricePollingController.getStatus);

// Start polling service
oracleRouter.post('/start', PricePollingController.startPolling);

// Stop polling service
oracleRouter.post('/stop', PricePollingController.stopPolling);

// Restart polling service
oracleRouter.post('/restart', PricePollingController.restartPolling);

// Get current prices (simple format)
oracleRouter.get('/prices', PricePollingController.getPrices);

// 🆕 Get market data for bot (full format with market cap, volume, etc.)
oracleRouter.get('/market-data', PricePollingController.getMarketData);

// Update polling intervals (requires restart)
oracleRouter.post('/intervals', PricePollingController.updateIntervals);

// Force immediate price update
oracleRouter.post('/force-update', PricePollingController.forceUpdate);

// Trigger webhook with current market data
oracleRouter.post('/trigger-webhook', PricePollingController.triggerWebhook);

export default oracleRouter;