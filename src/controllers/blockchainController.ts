import { Request, Response } from "express";
import {
    getAllocation,
    hasAllocation,
    getEstimatedOut,
    getContractBalance,
    validateRebalance,
    isPaused,
    getRouter,
    getOwner,
    encodeSetAllocation,
    encodeRemoveAllocation,
    encodeRevokeApproval,
    encodePause,
    encodeUnpause,
    validateAllocationPercents,
    formatTokenAmount,
    parseTokenAmount,
    getBatchAllocations,
    TokenAllocation
} from "../utils/blockchainhelpers.js";
import { bundlerClient } from "./clients.js";
import { findSmartAccountById as getSmartAccountByUserId } from "../utils/dbhelpers.js";

const SMART_PORTFOLIO_ADDRESS = process.env.SMART_PORTFOLIO_ADDRESS as `0x${string}`;

// ========================================
// READ OPERATIONS
// ========================================

/**
 * GET /api/portfolio/allocation/:userAddress
 * Get user's portfolio allocation
 */
export const getUserAllocation = async (req: Request, res: Response) => {
    try {
        const { userAddress } = req.params;

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
        console.error("Error fetching allocation:", error);
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
                userAddress,
                hasAllocation: hasAlloc
            }
        });
    } catch (error: any) {
        console.error("Error checking allocation:", error);
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
        const { amountIn, path, decimals = 18 } = req.body;

        if (!amountIn || !path || !Array.isArray(path)) {
            return res.status(400).json({
                success: false,
                error: "Invalid request: amountIn and path required"
            });
        }

        const amountInBigInt = parseTokenAmount(amountIn.toString(), decimals);
        const estimates = await getEstimatedOut(
            SMART_PORTFOLIO_ADDRESS,
            amountInBigInt,
            path
        );

        res.json({
            success: true,
            data: {
                amountIn,
                path,
                estimates: estimates.map((est, idx) => ({
                    step: idx,
                    amount: formatTokenAmount(est, decimals)
                }))
            }
        });
    } catch (error: any) {
        console.error("Error estimating swap:", error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

/**
 * GET /api/portfolio/balance/:tokenAddress
 * Get contract balance for a token
 */
export const getTokenBalance = async (req: Request, res: Response) => {
    try {
        const { tokenAddress } = req.params;
        const { decimals = 18 } = req.query;

        if (!tokenAddress || !tokenAddress.startsWith("0x")) {
            return res.status(400).json({
                success: false,
                error: "Invalid token address"
            });
        }

        const balance = await getContractBalance(
            SMART_PORTFOLIO_ADDRESS,
            tokenAddress as `0x${string}`
        );

        res.json({
            success: true,
            data: {
                tokenAddress,
                balanceRaw: balance.toString(),
                balanceFormatted: formatTokenAmount(balance, Number(decimals))
            }
        });
    } catch (error: any) {
        console.error("Error fetching balance:", error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

/**
 * POST /api/portfolio/validate-rebalance
 * Validate a rebalance before execution
 */
export const validateRebalanceController = async (req: Request, res: Response) => {
    try {
        const { tokenIn, tokenOut, amountIn, amountOutMin, path, decimals = 18 } = req.body;

        if (!tokenIn || !tokenOut || !amountIn || !amountOutMin || !path) {
            return res.status(400).json({
                success: false,
                error: "Missing required fields"
            });
        }

        const amountInBigInt = parseTokenAmount(amountIn.toString(), decimals);
        const amountOutMinBigInt = parseTokenAmount(amountOutMin.toString(), decimals);

        const validation = await validateRebalance(
            SMART_PORTFOLIO_ADDRESS,
            tokenIn,
            tokenOut,
            amountInBigInt,
            amountOutMinBigInt,
            path
        );

        res.json({
            success: true,
            data: validation
        });
    } catch (error: any) {
        console.error("Error validating rebalance:", error);
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
        const [paused, router, owner] = await Promise.all([
            isPaused(SMART_PORTFOLIO_ADDRESS),
            getRouter(SMART_PORTFOLIO_ADDRESS),
            getOwner(SMART_PORTFOLIO_ADDRESS)
        ]);

        res.json({
            success: true,
            data: {
                contractAddress: SMART_PORTFOLIO_ADDRESS,
                paused,
                router,
                owner
            }
        });
    } catch (error: any) {
        console.error("Error fetching contract status:", error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

/**
 * POST /api/portfolio/batch-allocations
 * Get multiple users' allocations
 */
export const getBatchAllocationsController = async (req: Request, res: Response) => {
    try {
        const { userAddresses } = req.body;

        if (!Array.isArray(userAddresses) || userAddresses.length === 0) {
            return res.status(400).json({
                success: false,
                error: "userAddresses must be a non-empty array"
            });
        }

        const allocations = await getBatchAllocations(
            SMART_PORTFOLIO_ADDRESS,
            userAddresses
        );

        const result: Record<string, TokenAllocation[]> = {};
        allocations.forEach((alloc, addr) => {
            result[addr] = alloc;
        });

        res.json({
            success: true,
            data: result
        });
    } catch (error: any) {
        console.error("Error fetching batch allocations:", error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};


// WRITE OPERATIONS
/**
 * POST /api/portfolio/set-allocation
 * Set user's portfolio allocation
 */
export const setAllocation = async (req: Request, res: Response) => {
    try {
        const { userId, tokens, percents } = req.body;

        if (!userId || !tokens || !percents) {
            return res.status(400).json({
                success: false,
                error: "userId, tokens, and percents are required"
            });
        }

        // Validate percentages
        const validation = validateAllocationPercents(percents);
        if (!validation.valid) {
            return res.status(400).json({
                success: false,
                error: validation.reason
            });
        }

        // Get user's smart account
        const smartAccount = await getSmartAccountByUserId(userId);
        if (!smartAccount) {
            return res.status(404).json({
                success: false,
                error: "Smart account not found"
            });
        }

        // Encode the function call
        const calldata = encodeSetAllocation(tokens, percents);

        // Send user operation
        const userOpHash = await bundlerClient.sendUserOperation({
            account: smartAccount,
            calls: [
                {
                    to: SMART_PORTFOLIO_ADDRESS,
                    data: calldata,
                    value: 0n
                }
            ]
        });

        res.json({
            success: true,
            data: {
                userOpHash,
                tokens,
                percents
            }
        });
    } catch (error: any) {
        console.error("Error setting allocation:", error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

/**
 * POST /api/portfolio/remove-allocation
 * Remove user's allocation
 */
export const removeAllocation = async (req: Request, res: Response) => {
    try {
        const { userId } = req.body;

        if (!userId) {
            return res.status(400).json({
                success: false,
                error: "userId is required"
            });
        }

        // Get user's smart account
        const smartAccount = await getSmartAccountByUserId(userId);
        if (!smartAccount) {
            return res.status(404).json({
                success: false,
                error: "Smart account not found"
            });
        }

        // Encode the function call
        const calldata = encodeRemoveAllocation();

        // Send user operation
        const userOpHash = await bundlerClient.sendUserOperation({
            account: smartAccount,
            calls: [
                {
                    to: SMART_PORTFOLIO_ADDRESS,
                    data: calldata,
                    value: 0n
                }
            ]
        });

        res.json({
            success: true,
            data: {
                userOpHash
            }
        });
    } catch (error: any) {
        console.error("Error removing allocation:", error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

/**
 * POST /api/portfolio/revoke-approval
 * Revoke token approval
 */
export const revokeApproval = async (req: Request, res: Response) => {
    try {
        const { userId, tokenAddress } = req.body;

        if (!userId || !tokenAddress) {
            return res.status(400).json({
                success: false,
                error: "userId and tokenAddress are required"
            });
        }

        // Get user's smart account
        const smartAccount = await getSmartAccountByUserId(userId);
        if (!smartAccount) {
            return res.status(404).json({
                success: false,
                error: "Smart account not found"
            });
        }

        // Encode the function call
        const calldata = encodeRevokeApproval(tokenAddress);

        // Send user operation
        const userOpHash = await bundlerClient.sendUserOperation({
            account: smartAccount,
            calls: [
                {
                    to: SMART_PORTFOLIO_ADDRESS,
                    data: calldata,
                    value: 0n
                }
            ]
        });

        res.json({
            success: true,
            data: {
                userOpHash,
                tokenAddress
            }
        });
    } catch (error: any) {
        console.error("Error revoking approval:", error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

/**
 * POST /api/portfolio/pause
 * Pause the contract (owner only)
 */
export const pauseContract = async (req: Request, res: Response) => {
    try {
        const { userId } = req.body;

        if (!userId) {
            return res.status(400).json({
                success: false,
                error: "userId is required"
            });
        }

        // Get user's smart account
        const smartAccount = await getSmartAccountByUserId(userId);
        if (!smartAccount) {
            return res.status(404).json({
                success: false,
                error: "Smart account not found"
            });
        }

        // Encode the function call
        const calldata = encodePause();

        // Send user operation
        const userOpHash = await bundlerClient.sendUserOperation({
            account: smartAccount,
            calls: [
                {
                    to: SMART_PORTFOLIO_ADDRESS,
                    data: calldata,
                    value: 0n
                }
            ]
        });

        res.json({
            success: true,
            data: {
                userOpHash
            }
        });
    } catch (error: any) {
        console.error("Error pausing contract:", error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

/**
 * POST /api/portfolio/unpause
 * Unpause the contract (owner only)
 */
export const unpauseContract = async (req: Request, res: Response) => {
    try {
        const { userId } = req.body;

        if (!userId) {
            return res.status(400).json({
                success: false,
                error: "userId is required"
            });
        }

        // Get user's smart account
        const smartAccount = await getSmartAccountByUserId(userId);
        if (!smartAccount) {
            return res.status(404).json({
                success: false,
                error: "Smart account not found"
            });
        }

        // Encode the function call
        const calldata = encodeUnpause();

        // Send user operation
        const userOpHash = await bundlerClient.sendUserOperation({
            account: smartAccount,
            calls: [
                {
                    to: SMART_PORTFOLIO_ADDRESS,
                    data: calldata,
                    value: 0n
                }
            ]
        });

        res.json({
            success: true,
            data: {
                userOpHash
            }
        });
    } catch (error: any) {
        console.error("Error unpausing contract:", error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

