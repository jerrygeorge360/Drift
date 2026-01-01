import { createPortfolio, getPortfolioBySmartAccountId, updatePortfolioName, findSmartAccountById, updatePortfolioAddress, getContractAddressByName } from "../../utils/dbhelpers.js";
import { deployUserPortfolio, getPortfolioAddressFromFactory } from "../../utils/portfolioFactoryHelpers.js";
import { reconstructSmartAccount } from "../../utils/delegationhelpers.js";
import { decryptPrivateKey } from "../../utils/encryption.js";
import { createChainClient } from "../../controllers/clients.js";
import { SupportedChain, getChainConfig } from "../../config/chainConfig.js";
import { setupAccountAbstractionClients } from "../../utils/deployScript.js";
import { logger } from "../../utils/logger.js";
import dotenv from "dotenv"
dotenv.config();
export interface SyncOrDeployPortfolioResult {
    success: boolean;
    portfolio: any;
    deployment?: {
        transactionHash?: string;
        userOpHash?: string;
        error?: string;
    };
    deploymentRequired: boolean;
}

/**
 * Syncs an existing portfolio with on-chain data or deploys a new one if requested.
 * This function handles both database updates and on-chain interactions.
 */
export async function syncOrDeployPortfolio(
    smartAccountId: string,
    name?: string,
    chainId: SupportedChain = "sepolia",
    autoDeploy: boolean = false
): Promise<SyncOrDeployPortfolioResult> {
    try {
        const chainConfig = getChainConfig(chainId);

        // Check if portfolio already exists for this smart account
        const existingPortfolio = await getPortfolioBySmartAccountId(smartAccountId);

        // Get user's smart account to check/deploy portfolio
        const smartAccount = await findSmartAccountById(smartAccountId);
        if (!smartAccount || !smartAccount.privateKey) {
            throw new Error("Smart account not found or missing private key");
        }

        // Decrypt private key and reconstruct smart account
        const decryptedPrivateKey = decryptPrivateKey(smartAccount.privateKey);
        const userSmartAccount = await reconstructSmartAccount(decryptedPrivateKey);

        const deployedPortfolioFactory = await getContractAddressByName("PortfolioFactory_Sepolia")

        if (!deployedPortfolioFactory) {
            throw new Error("PortfolioFactory not deployed");
        }

        // Check if portfolio already exists on-chain
        let portfolioAddress = await getPortfolioAddressFromFactory(
            userSmartAccount.address,
            deployedPortfolioFactory,
            createChainClient(chainId),
            chainId
        );

        let deploymentResult = undefined;

        // If not deployed and autoDeploy is requested, deploy it
        if (!portfolioAddress && autoDeploy) {
            const rpcUrl = process.env.PIMLICO_API_URL_SEPOLIA;
            const pimlicoUrl = process.env.PIMLICO_API_URL_SEPOLIA;


            if (!rpcUrl || !pimlicoUrl) {
                throw new Error(`Missing Pimlico configuration for ${chainId}`);
            }

            const { pimlicoClient, paymasterClient } = await setupAccountAbstractionClients({
                chain: chainConfig.chain,
                rpcUrl,
                pimlicoUrl,
            });

            const deployResult = await deployUserPortfolio(
                userSmartAccount,
                rpcUrl,
                pimlicoClient,
                paymasterClient,
                chainId
            );

            if (deployResult.success) {
                portfolioAddress = deployResult.portfolioAddress || null;
                deploymentResult = {
                    transactionHash: deployResult.transactionHash,
                    userOpHash: deployResult.userOpHash
                };
            } else {
                logger.error("Portfolio deployment failed", deployResult.error);
                deploymentResult = { error: deployResult.error };
            }
        }

        let resultPortfolio;

        if (existingPortfolio) {
            // Update existing portfolio
            const updateData: any = {};
            if (name && typeof name === "string" && name.trim().length >= 2) {
                updateData.name = name.trim();
            }
            if (portfolioAddress) {
                updateData.portfolioAddress = portfolioAddress;
            }

            // If there's something to update
            if (Object.keys(updateData).length > 0) {
                if (updateData.name) {
                    await updatePortfolioName(smartAccountId, updateData.name);
                }
                if (updateData.portfolioAddress) {
                    resultPortfolio = await updatePortfolioAddress(smartAccountId, updateData.portfolioAddress);
                } else {
                    resultPortfolio = await getPortfolioBySmartAccountId(smartAccountId);
                }
            } else {
                resultPortfolio = existingPortfolio;
            }
        } else {
            // Create new portfolio if it doesn't exist
            const portfolioName = name && typeof name === "string" && name.trim().length >= 2 ? name.trim() : "Default Portfolio";
            resultPortfolio = await createPortfolio(smartAccountId, portfolioName, portfolioAddress || undefined);
        }

        return {
            success: true,
            portfolio: resultPortfolio,
            deployment: deploymentResult,
            deploymentRequired: !portfolioAddress,
        };

    } catch (error) {
        logger.error("Error in syncOrDeployPortfolio", error);
        throw error;
    }
}
