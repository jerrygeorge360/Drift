import { Router } from 'express';
import PricePollingController from "../controllers/oracleController.js";

const oracleRouter = Router();

oracleRouter.get('/status', PricePollingController.getStatus);


oracleRouter.post('/start', PricePollingController.startPolling);


oracleRouter.post('/stop', PricePollingController.stopPolling);


oracleRouter.post('/restart', PricePollingController.restartPolling);


oracleRouter.get('/prices', PricePollingController.getPrices);

// Update polling intervals (requires restart)
oracleRouter.post('/intervals', PricePollingController.updateIntervals);

oracleRouter.post('/force-update', PricePollingController.forceUpdate);

export default oracleRouter;
