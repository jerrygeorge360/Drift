import express from 'express';
import {
    createPortfolioController,
    getPortfolioController,
    updatePortfolioNameController,
    deployPortfolioController,
} from "../controllers/portfolioController.js";

const portfolioRouter = express.Router();

// Create portfolio
portfolioRouter.post("/", createPortfolioController);

// Deploy portfolio on-chain
portfolioRouter.post("/deploy", deployPortfolioController);

// Get portfolio by smartAccountId
portfolioRouter.get("/:smartAccountId", getPortfolioController);

// Update portfolio name
portfolioRouter.put("/:smartAccountId", updatePortfolioNameController);

export default portfolioRouter;
