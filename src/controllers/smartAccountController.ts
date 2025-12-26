import { Request, Response, NextFunction } from "express";
import { privateKeyToAccount, generatePrivateKey } from "viem/accounts";
import {
    Implementation,
    toMetaMaskSmartAccount,
} from "@metamask/smart-accounts-kit";
import { publicClient } from "./clients.js";
import { encryptPrivateKey } from "../utils/encryption.js";
import {
    createSmartAccountdb,
    deleteSmartAccountById,
    findSmartAccountById,
    getUserSmartAccounts
} from "../utils/dbhelpers.js"
import { monadTestnet } from "viem/chains";
import { 
    initializeWithValidation, 
    getMonadTestnetEnvironment,
    MONAD_TESTNET_CHAIN_ID 
} from "../config/metamask_monadtestnet_config.js";



export interface AuthRequest extends Request {
    user?: { id: string; address: string };
}


export const createSmartAccount = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        console.log("Create Smart Account request body:", req.body);
        if (!req.user?.address || !req.user?.id) {
            return res.status(401).json({ message: "Unauthorized: User info missing" });
        }

        // Initialize MetaMask environment for Monad testnet
        try {
            initializeWithValidation();
            console.log("✅ MetaMask environment initialized for smart account creation");
        } catch (envError) {
            console.error("❌ Failed to initialize MetaMask environment:", envError);
            return res.status(500).json({ 
                message: "Failed to initialize MetaMask environment",
                error: envError instanceof Error ? envError.message : String(envError)
            });
        }

        const walletAddress = req.user.address;
        const userId = req.user.id;
        const autoDeploy = req.body.autoDeploy === true; // Optional: auto-deploy on creation

        const privateKey = generatePrivateKey();
        const account = privateKeyToAccount(privateKey);
        const encrypted = encryptPrivateKey(privateKey);

        // Get the Monad testnet environment to ensure we're using the correct contracts
        const monadEnvironment = getMonadTestnetEnvironment();
        
        console.log("Creating smart account with Monad testnet environment...");
        console.log("Using Hybrid implementation address:", monadEnvironment.implementations.Hybrid);
        console.log("Using SimpleFactory address:", monadEnvironment.SimpleFactory);

        const smartAccount = await toMetaMaskSmartAccount({
            client: publicClient,
            implementation: Implementation.Hybrid, // This will use your overridden environment
            deployParams: [account.address, [], [], []],
            deploySalt: "0x",
            signer: { account },
        });

        const ownerAddress = account.address;

        const createdSmartAccount = await createSmartAccountdb(userId, smartAccount.address, encrypted, walletAddress, ownerAddress);

        // Auto-deploy if requested
        let deploymentResult = null;
        if (autoDeploy) {
            try {
                const rpcUrl = process.env.PIMLICO_API_URL;
                if (!rpcUrl) {
                    return res.status(500).json({ message: "RPC URL not configured" });
                }

                const pimlicoUrl = process.env.PIMLICO_API_URL;
                if (!pimlicoUrl) {
                    return res.status(500).json({ message: "Pimlico URL not configured" });
                }

                // Import the auto-deploy function
                const { autoDeploySmartAccount } = await import("../modules/delegation/services.js");
                const { setupAccountAbstractionClients } = await import("../utils/deployScript.js");
                const { updateSmartAccountDeploymentStatus } = await import("../utils/dbhelpers.js");

                // Get clients for deployment
                const { publicClient, bundlerClient, pimlicoClient, paymasterClient } = await setupAccountAbstractionClients({
                    chain: monadTestnet,
                    rpcUrl,
                    pimlicoUrl,
                });

                deploymentResult = await autoDeploySmartAccount(
                    smartAccount,
                    publicClient,
                    bundlerClient,
                    pimlicoClient,
                    paymasterClient
                );

                console.log("Auto-deployment result:", deploymentResult);

                // Update database with deployment status
                if (deploymentResult.deployed && deploymentResult.transactionHash) {
                    await updateSmartAccountDeploymentStatus(
                        createdSmartAccount.id,
                        deploymentResult.transactionHash
                    );
                    console.log("Deployment status saved to database");
                }
            } catch (deployError: any) {
                console.error("Auto-deployment failed:", deployError);
                // Don't fail the entire request, just log the error
                deploymentResult = { error: deployError.message };
            }
        }

        return res.status(200).json({
            message: "Smart account created successfully",
            account: {
                ...createdSmartAccount,
                environmentConfigured: true,
                chainId: MONAD_TESTNET_CHAIN_ID,
                contractAddresses: {
                    simpleFactory: monadEnvironment.SimpleFactory,
                    delegationManager: monadEnvironment.DelegationManager,
                    hybridImplementation: monadEnvironment.implementations.Hybrid,
                    entryPoint: monadEnvironment.EntryPoint,
                },
            },
            deployment: deploymentResult,
        });

    } catch (err) {
        next(err);
    }
}



export const deleteSmartAccount = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        if (!req.user?.id) {
            return res.status(401).json({ message: "Unauthorized: User info missing" });
        }

        const userId = req.user.id;
        const smartAccountId = req.params.id;

        if (!smartAccountId) {
            return res.status(400).json({ message: "Smart account ID is required" });
        }

        // Get all smart accounts of user
        const userSmartAccounts = await getUserSmartAccounts(userId);

        // Check if smartAccountId is among user's smart accounts
        const smartAccount = userSmartAccounts.find((sa: { id: string; }) => sa.id === smartAccountId);

        if (!smartAccount) {
            return res.status(404).json({ message: "Smart account not found or not owned by you" });
        }

        // Delete the smart account
        await deleteSmartAccountById(smartAccountId);

        return res.status(200).json({ message: "Smart account deleted successfully" });
    } catch (error) {
        next(error);
    }
};

export const getUserSmartAccountList = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        if (!req.user?.id) {
            return res.status(401).json({ message: "Unauthorized: User info missing" });
        }

        const userId = req.user.id;
        const smartAccounts = await getUserSmartAccounts(userId);

        return res.status(200).json({ smartAccounts });
    } catch (error) {
        next(error);
    }
};


export const getSmartAccountById = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        if (!req.user?.id) {
            return res.status(401).json({ message: "Unauthorized: User info missing" });
        }

        const userId = req.user.id;
        const smartAccountId = req.params.id;

        if (!smartAccountId) {
            return res.status(400).json({ message: "Smart account ID is required" });
        }

        const smartAccount = await findSmartAccountById(smartAccountId);

        if (!smartAccount || smartAccount.userId !== userId) {
            return res.status(404).json({ message: "Smart account not found or not owned by you" });
        }

        return res.status(200).json({ smartAccount });
    } catch (error) {
        next(error);
    }
};