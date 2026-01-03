import { Request, Response } from "express";
import { getPortfolioBySmartAccountId } from "../utils/dbhelpers.js";
import { syncOrDeployPortfolio } from "../modules/portfolio/portfolio.service.js";
import { SupportedChain, isValidChain } from "../config/chainConfig.js";
import { logger } from "../utils/logger.js";

// Get portfolio by smartAccountId
export const getPortfolioController = async (req: Request, res: Response) => {
    const { smartAccountId } = req.params;

    if (!smartAccountId) {
        return res.status(400).json({ error: "smartAccountId is required" });
    }

    const portfolio = await getPortfolioBySmartAccountId(smartAccountId);

    if (!portfolio) {
        return res.status(404).json({ error: "Portfolio not found" });
    }

    res.status(200).json({ success: true, data: portfolio });
};


export const deployPortfolioController = async (req: Request, res: Response) => {
    const { smartAccountId, name, chainId, autoDeploy } = req.body;

    if (!smartAccountId || typeof smartAccountId !== "string") {
        return res.status(400).json({ error: "smartAccountId is required" });
    }

    // Validate chain if provided, default to monad
    const targetChain: SupportedChain = chainId || "monad";
    if (!isValidChain(targetChain)) {
        return res.status(400).json({
            error: "Invalid chain specified",
            supportedChains: ["monad", "sepolia"]
        });
    }

    try {
        const result = await syncOrDeployPortfolio(
            smartAccountId,
            name,
            targetChain,
            autoDeploy === true
        );

        res.status(result.portfolio ? 200 : 201).json({
            success: true,
            message: "Portfolio processed successfully",
            data: {
                ...result.portfolio,
                deployment: result.deployment,
                deploymentRequired: result.deploymentRequired,
            },
        });

    } catch (error) {
        logger.error("Error handling portfolio", error);
        res.status(500).json({
            error: "Failed to process portfolio",
            details: error instanceof Error ? error.message : "Unknown error"
        });
    }
};