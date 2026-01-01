import { Request, Response } from "express";
import { MetaMaskSmartAccount } from "@metamask/smart-accounts-kit"
import {
    createSignedDelegation as delegationService
} from "../modules/delegation/services.js";

import { reconstructSmartAccount } from "../utils/delegationhelpers.js";
import {
    createDelegationdb,
    findSmartAccountById, getBotByName,
    getUserSmartAccounts,
    revokeDelegation,
    getDelegationById,
    getPortfolioBySmartAccountId,
    findTokenByAddress,
    createRebalanceLog,
    getContractAddressByName,
    getPortfolioAddressBySmartAccountId
} from "../utils/dbhelpers.js";
import { decryptPrivateKey } from "../utils/encryption.js";
import { redeemDelegationService } from "../modules/bot/bot.delegation.js";
import { RebalanceParams } from "../modules/bot/bot.types.js";
import { RedeemResult } from "../modules/delegation/types.js";
import { logger } from "../utils/logger.js";

export interface AuthRequest extends Request {
    user?: { id: string; address: string };
}

export const createDelegationController = async (req: AuthRequest, res: Response) => {
    try {

        if (!req.user?.address || !req.user?.id) {
            return res.status(401).json({ message: "Unauthorized: User info missing" });
        }
        const userId = req.user?.id;
        const smartAccountId = req.params.smartAccountId;
        // Get all smart accounts of user
        const userSmartAccounts = await getUserSmartAccounts(userId);

        // Check if smartAccountId is among user's smart accounts
        const smartAccounts = userSmartAccounts.find((sa: { id: string; }) => sa.id === smartAccountId);

        if (!smartAccounts) {
            return res.status(404).json({ message: "Smart account not found or not owned by you" });
        }

        const smartAccount = await findSmartAccountById(smartAccountId)
        if (!smartAccount || !smartAccount.privateKey) {
            throw ('No smartAccount or privateKey failed')
        }

        const monitoredTokens: `0x${string}`[] = req.body.monitoredTokens
        if (!monitoredTokens) {
            return res.status(404).json({ message: "No token to monitor" })
        }
        // collect user ids and query for the keys
        // deencrypt the keys

        const bot = await getBotByName('Drift', true)
        if (!bot || !bot.privateKey) {
            return res.status(401).json({ message: "No bot or privateKey failed" });
        }
        const delegatorPrivateKey: `0x${string}` = decryptPrivateKey(smartAccount.privateKey);
        const delegatePrivateKey: `0x${string}` = bot.privateKey;

        const delegatorSmartAccount: MetaMaskSmartAccount = await reconstructSmartAccount(delegatorPrivateKey)
        const delegateSmartAccount: MetaMaskSmartAccount = await reconstructSmartAccount(delegatePrivateKey)

        // Get user's portfolio address (individual portfolio from factory)
        const userPortfolioAddress = await getPortfolioAddressBySmartAccountId(smartAccountId);
        if (!userPortfolioAddress) {
            return res.status(404).json({
                message: "User portfolio not found. Please create and deploy a portfolio first."
            });
        }
        // Create and sign the delegation

        const signature = await delegationService(
            delegatorSmartAccount,
            delegateSmartAccount,
            userPortfolioAddress as `0x${string}`,
            monitoredTokens
        );

        if (!smartAccountId || !delegatorPrivateKey || !delegatePrivateKey || !signature) {
            return res.status(400).json({ message: "Missing or invalid fields" });
        }

        const delegation = await createDelegationdb({
            smartAccountId,
            delegatorSmartAccount,
            delegateSmartAccount,
            signature,
        })

        return res.status(200).json({
            message: "Delegation created successfully",
            delegation: {
                id: delegation.id,
                smartAccountId: delegation.smartAccountId,
                delegatorAddress: delegation.delegatorAddress,
                delegateAddress: delegation.delegateAddress,
                createdAt: delegation.createdAt,
                updatedAt: delegation.updatedAt,
            },
        });
    } catch (error: any) {
        logger.error("Error creating delegation", error);
        return res.status(500).json({
            message: "Failed to create delegation",
            error: error.message || error,
        });
    }
};





export const redeemDelegationController = async (req: Request, res: Response): Promise<Response> => {
    // DONE : convert this to a real route not testcontroller probably integrate it with the webhook controller
    try {
        const smartAccountId: string = req.params.smartAccountId;
        const delegationId: string = req.params.delegationId;
        const data: RebalanceParams = req.body.data;
        const txResult: RedeemResult = await redeemDelegationService(
            delegationId,
            data
        );

        // Save transaction result to database
        try {
            const portfolio = await getPortfolioBySmartAccountId(smartAccountId);
            if (portfolio) {
                // Get token IDs from addresses
                const tokenIn = await findTokenByAddress(data.tokenIn);
                const tokenOut = await findTokenByAddress(data.tokenOut);

                if (tokenIn && tokenOut) {
                    await createRebalanceLog({
                        portfolioId: portfolio.id,
                        tokenInId: tokenIn.id,
                        tokenOutId: tokenOut.id,
                        amountIn: Number(data.amountIn) / Math.pow(10, tokenIn.decimals), // Convert from wei
                        amountOut: Number(data.amountOutMin) / Math.pow(10, tokenOut.decimals), // Convert from wei
                        reason: data.reason,
                        executor: data.botAddress,
                        userOpHash: txResult.userOpHash,
                        transactionHash: txResult.transactionHash,
                        blockNumber: txResult.blockNumber,
                        status: txResult.status,
                        gasUsed: txResult.gasUsed,
                    });
                    logger.info("Rebalance log saved to database");
                } else {
                    logger.warn("Could not find tokens in database, skipping log save");
                }
            } else {
                logger.warn("Portfolio not found, skipping log save");
            }
        } catch (dbError) {
            logger.error("Failed to save rebalance log to database", dbError);
            // Don't fail the entire request if DB save fails
        }

        return res.status(200).json({
            success: true,
            message: "Redeem delegation executed successfully",
            data: txResult,
        });
    } catch (error: any) {
        logger.error("Redeem Delegation Error", error);
        return res.status(500).json({
            success: false,
            message: "Failed to execute redeem delegation",
            error: error?.message || String(error),
        });
    }
};


// TODO : make an offchain blockchain pair checker
// TODO : make an offchain blockchain swap path checker
// DONE: make custom tokens,deploy the tokens,and make it liquid(done)



export const revokeDelegationController = async (req: AuthRequest, res: Response) => {
    try {
        // Check authentication
        if (!req.user?.address || !req.user?.id) {
            return res.status(401).json({ message: "Unauthorized: User info missing" });
        }

        const userId = req.user.id;
        const delegationId = req.params.delegationId;

        // Validate delegation ID is provided
        if (!delegationId) {
            return res.status(400).json({ message: "Delegation ID is required" });
        }

        // Fetch the delegation
        const delegation = await getDelegationById(delegationId);

        // Check if delegation exists
        if (!delegation) {
            return res.status(404).json({ message: "Delegation not found" });
        }

        // Check if delegation is already revoked
        if (delegation.revoked) {
            return res.status(400).json({
                message: "Delegation has already been revoked",
                revokedAt: delegation.updatedAt
            });
        }

        // Fetch the smart account associated with this delegation
        const smartAccount = await findSmartAccountById(delegation.smartAccountId);

        // Verify smart account exists
        if (!smartAccount) {
            return res.status(404).json({ message: "Smart account associated with delegation not found" });
        }

        // Verify ownership: ensure the smart account belongs to the authenticated user
        if (smartAccount.userId !== userId) {
            return res.status(403).json({
                message: "Forbidden: You do not have permission to revoke this delegation"
            });
        }

        // All validations passed, proceed with revocation
        await revokeDelegation(delegationId);

        return res.status(200).json({
            message: "Delegation revoked successfully",
            delegationId,
            revokedAt: new Date().toISOString()
        });

    } catch (error: any) {
        logger.error("Error revoking delegation", error);
        // @ts-ignore
        return res.status(500).json({
            message: "Failed to revoke delegation",
            error: error?.message || "Internal server error"
        });
    }
}

// DONE : implement revoke of delegation.
// DONE : add proper validation in the revoke delegation