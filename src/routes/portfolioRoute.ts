import express from 'express';
import {
    deployPortfolioController,
    getPortfolioController,
} from "../controllers/portfolioController.js";

const portfolioRouter = express.Router();

// Deploy/Manage portfolio (Create/Update/Deploy)
portfolioRouter.post("/", deployPortfolioController);

// Get portfolio by smartAccountId
portfolioRouter.get("/:smartAccountId", getPortfolioController);

export default portfolioRouter;
