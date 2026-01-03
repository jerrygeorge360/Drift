import { Request, Response } from "express";
import {
    getAllocation,
    hasAllocation,
    getEstimatedOut,
    isPaused,
    getRouter,
    getOwner
} from "../utils/blockchainhelpers.js";
import { getContractAddressByName } from "../utils/dbhelpers.js";
import { logger } from "../utils/logger.js";


// READ OPERATIONS

/**
 * GET /api/portfolio/allocation/:userAddress
 * Get user's portfolio allocation
 */
export const getUserAllocation = async (req: Request, res: Response) => {
    try {
        const { userAddress } = req.params;
        const SMART_PORTFOLIO_ADDRESS = await getContractAddressByName('smartPortfolioContract');
        if (!SMART_PORTFOLIO_ADDRESS) {
            return res.status(400).json({ message: 'missing contract address' })
        }
        if (!userAddress || !userAddress.startsWith("0x")) {
            return res.status(400).json({
                success: false,
                error: "Invalid user address"
            });
        }

        const allocation = await getAllocation(
            SMART_PORTFOLIO_ADDRESS,
            userAddress as `0x${string}`
        );

        res.json({
            success: true,
            data: {
                userAddress,
                allocation,
                hasAllocation: allocation.length > 0
            }
        });
    } catch (error: any) {
        logger.error("Error fetching allocation", error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

/**
 * GET /api/portfolio/has-allocation/:userAddress
 * Check if user has an allocation
 */
export const checkHasAllocation = async (req: Request, res: Response) => {
    try {
        const { userAddress } = req.params;
        const SMART_PORTFOLIO_ADDRESS = await getContractAddressByName('smartPortfolioContract');
        if (!SMART_PORTFOLIO_ADDRESS) {
            return res.status(400).json({ message: 'missing contract address' })
        }

        if (!userAddress || !userAddress.startsWith("0x")) {
            return res.status(400).json({
                success: false,
                error: "Invalid user address"
            });
        }

        const hasAlloc = await hasAllocation(
            SMART_PORTFOLIO_ADDRESS,
            userAddress as `0x${string}`
        );

        res.json({
            success: true,
            data: {

                hasAllocation: hasAlloc
            }
        });
    } catch (error: any) {
        logger.error("Error checking allocation", error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

/**
 * POST /api/portfolio/estimate-swap
 * Get estimated output for a swap
 */
export const estimateSwap = async (req: Request, res: Response) => {
    try {
        const SMART_PORTFOLIO_ADDRESS = await getContractAddressByName('smartPortfolioContract');
        if (!SMART_PORTFOLIO_ADDRESS) {
            return res.status(400).json({ message: 'missing contract address' })
        }
        const { amountIn, path } = req.body;

        if (!amountIn || !path) {
            return res.status(400).json({
                success: false,
                error: "Invalid request: amountIn and path required"
            });
        }

        const estimates = await getEstimatedOut(
            SMART_PORTFOLIO_ADDRESS,
            amountIn,
            path
        );

        res.json({
            success: true,
            data: {
                estimates
            }
        });
    } catch (error: any) {
        logger.error("Error estimating swap", error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};


/**
 * GET /api/portfolio/status
 * Get contract status
 */
export const getContractStatus = async (req: Request, res: Response) => {
    try {
        const SMART_PORTFOLIO_ADDRESS = await getContractAddressByName('smartPortfolioContract');
        if (!SMART_PORTFOLIO_ADDRESS) {
            return res.status(400).json({ message: 'missing contract address' })
        }
        const [paused, router, owner] = await Promise.all([
            isPaused(SMART_PORTFOLIO_ADDRESS),
            getRouter(SMART_PORTFOLIO_ADDRESS),
            getOwner(SMART_PORTFOLIO_ADDRESS)
        ]);

        res.json({
            success: true,
            data: {
                paused,
                router,
                owner
            }
        });
    } catch (error: any) {
        logger.error("Error fetching contract status", error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};
