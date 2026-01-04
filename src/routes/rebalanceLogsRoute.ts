import express from "express";

import {getRebalanceLogsController, createRebalanceLogController, getRebalanceAnalyticsController} from "../controllers/rebalanceController.js";

const rebalanceRouter = express.Router();

// Create a new rebalance log
rebalanceRouter.post("/", createRebalanceLogController);

// Get rebalance analytics (must come before /:portfolioId route)
rebalanceRouter.get("/analytics", getRebalanceAnalyticsController);

// Get all rebalance logs for a specific portfolio
rebalanceRouter.get("/:portfolioId", getRebalanceLogsController);

export default rebalanceRouter;
