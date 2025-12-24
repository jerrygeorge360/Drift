import { Request, Response } from "express";
import { createPortfolio, getPortfolioBySmartAccountId, updatePortfolioName, findSmartAccountById, updatePortfolioAddress } from "../utils/dbhelpers.js";
import { deployUserPortfolio, hasPortfolioDeployed, getPortfolioAddressFromFactory } from "../utils/portfolioFactoryHelpers.js";
import { reconstructSmartAccount } from "../utils/delegationhelpers.js";
import { decryptPrivateKey } from "../utils/encryption.js";
import { getContractAddressByName } from "../utils/dbhelpers.js";
import { createPublicClient, http } from "viem";
import { monadTestnet as chain } from "viem/chains";

// ✅ Get portfolio by smartAccountId
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

// ✅ Update portfolio name
export const updatePortfolioNameController = async (req: Request, res: Response) => {
    const { smartAccountId } = req.params;
    const { newName } = req.body;

    if (!smartAccountId) {
        return res.status(400).json({ error: "smartAccountId is required" });
    }

    if (!newName || typeof newName !== "string" || newName.trim().length < 2) {
        return res.status(400).json({ error: "A valid newName is required" });
    }

    const updatedPortfolio = await updatePortfolioName(smartAccountId, newName.trim());

    res.status(200).json({
        success: true,
        message: "Portfolio name updated successfully",
        data: updatedPortfolio,
    });
};


export const createPortfolioController = async (req: Request, res: Response) => {
    const { smartAccountId, name } = req.body;

    if (!smartAccountId || typeof smartAccountId !== "string") {
        return res.status(400).json({ error: "smartAccountId is required" });
    }

    if (!name || typeof name !== "string" || name.trim().length < 2) {
        return res.status(400).json({ error: "A valid portfolio name is required" });
    }

    try {
        // Prevent duplicates (since each smartAccount can have only one portfolio)
        const existing = await getPortfolioBySmartAccountId(smartAccountId);
        if (existing) {
            return res.status(400).json({ error: "Portfolio already exists for this smart account" });
        }

        // Get user's smart account to deploy portfolio
        const smartAccount = await findSmartAccountById(smartAccountId);
        if (!smartAccount || !smartAccount.privateKey) {
            return res.status(404).json({ error: "Smart account not found or missing private key" });
        }

        // Decrypt private key and reconstruct smart account
        const decryptedPrivateKey = decryptPrivateKey(smartAccount.privateKey);
        const userSmartAccount = await reconstructSmartAccount(decryptedPrivateKey);

        // Check if portfolio already exists on-chain
        const alreadyDeployed = await hasPortfolioDeployed(userSmartAccount.address);
        let portfolioAddress: string | null = null;

        if (alreadyDeployed) {
            // Get existing portfolio address from factory
            const factoryAddress = await getContractAddressByName("PortfolioFactory");
            if (factoryAddress) {
                const publicClient = createPublicClient({ chain, transport: http() });
                portfolioAddress = await getPortfolioAddressFromFactory(
                    userSmartAccount.address,
                    factoryAddress,
                    publicClient
                );
            }
        } else {
            // Deploy new portfolio via factory
            // Note: You'll need to pass pimlicoClient and rpcUrl - these should come from your env/config
            const rpcUrl = process.env.PIMLICO_RPC_URL || ""; // Add to your environment
            const pimlicoApiKey = process.env.PIMLICO_API_KEY || "";
            
            if (!rpcUrl || !pimlicoApiKey) {
                return res.status(500).json({ error: "Missing Pimlico configuration" });
            }

            // For now, we'll create without deployment and allow manual deployment later
            // You can implement the full deployment flow here when you have the Pimlico config ready
        }

        // Create portfolio in database
        const newPortfolio = await createPortfolio(smartAccountId, name.trim(), portfolioAddress || undefined);

        res.status(201).json({
            success: true,
            message: "Portfolio created successfully",
            data: {
                ...newPortfolio,
                deploymentRequired: !portfolioAddress, // Indicates if on-chain deployment is needed
            },
        });

    } catch (error) {
        console.error("Error creating portfolio:", error);
        res.status(500).json({ 
            error: "Failed to create portfolio", 
            details: error instanceof Error ? error.message : "Unknown error" 
        });
    }
};

// Deploy portfolio on-chain via factory
export const deployPortfolioController = async (req: Request, res: Response) => {
    const { smartAccountId } = req.body;

    if (!smartAccountId || typeof smartAccountId !== "string") {
        return res.status(400).json({ error: "smartAccountId is required" });
    }

    try {
        // Get portfolio from database
        const portfolio = await getPortfolioBySmartAccountId(smartAccountId);
        if (!portfolio) {
            return res.status(404).json({ error: "Portfolio not found" });
        }

        if ((portfolio as any).portfolioAddress) {
            return res.status(400).json({ error: "Portfolio already deployed on-chain" });
        }

        // Get user's smart account
        const smartAccount = await findSmartAccountById(smartAccountId);
        if (!smartAccount || !smartAccount.privateKey) {
            return res.status(404).json({ error: "Smart account not found or missing private key" });
        }

        // Decrypt private key and reconstruct smart account
        const decryptedPrivateKey = decryptPrivateKey(smartAccount.privateKey);
        const userSmartAccount = await reconstructSmartAccount(decryptedPrivateKey);

        // Get configuration from environment
        const rpcUrl = process.env.PIMLICO_RPC_URL;
        const pimlicoApiKey = process.env.PIMLICO_API_KEY;
        
        if (!rpcUrl || !pimlicoApiKey) {
            return res.status(500).json({ error: "Missing Pimlico configuration for deployment" });
        }

        // TODO: Create Pimlico client here when you have the configuration ready
        // const pimlicoClient = createPimlicoClient({ apiKey: pimlicoApiKey });

        // Deploy portfolio via factory
        // For now, returning a message that deployment configuration is needed
        return res.status(501).json({ 
            message: "Portfolio deployment requires Pimlico configuration",
            instructions: "Please configure PIMLICO_RPC_URL and PIMLICO_API_KEY environment variables"
        });

        // When Pimlico is configured, use this code:
        /*
        const deployResult = await deployUserPortfolio(
            userSmartAccount,
            rpcUrl,
            pimlicoClient
        );

        if (!deployResult.success) {
            return res.status(500).json({ 
                error: "Failed to deploy portfolio", 
                details: deployResult.error 
            });
        }

        // Update database with portfolio address
        const updatedPortfolio = await updatePortfolioAddress(smartAccountId, deployResult.portfolioAddress!);

        res.status(200).json({
            success: true,
            message: "Portfolio deployed successfully",
            data: {
                portfolio: updatedPortfolio,
                deploymentInfo: {
                    portfolioAddress: deployResult.portfolioAddress,
                    transactionHash: deployResult.transactionHash,
                    userOpHash: deployResult.userOpHash,
                }
            },
        });
        */

    } catch (error) {
        console.error("Error deploying portfolio:", error);
        res.status(500).json({ 
            error: "Failed to deploy portfolio", 
            details: error instanceof Error ? error.message : "Unknown error" 
        });
    }
};