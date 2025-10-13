import express from "express";

import {getRebalanceLogsController,createRebalanceLogController} from "../controllers/rebalanceController.js";

const rebalanceRouter = express.Router();

// ✅ Create a new rebalance log
rebalanceRouter.post("/", createRebalanceLogController);

// ✅ Get all rebalance logs for a specific portfolio
rebalanceRouter.get("/:portfolioId", getRebalanceLogsController);


export default rebalanceRouter;
