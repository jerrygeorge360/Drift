import { encodeFunctionData, createPublicClient, http, Chain } from "viem";
import { monadTestnet, sepolia } from "viem/chains";
import { createBundlerClient } from "viem/account-abstraction";
import portfolioFactory from "../contracts/abi/PortfolioFactory.json" with { type: 'json' };
import { MetaMaskSmartAccount } from "@metamask/smart-accounts-kit";
import { getContractAddressByName } from "./dbhelpers.js";
import { SupportedChain, getChainConfig } from "../config/chainConfig.js";
import { logger } from "./logger.js";

export interface DeployPortfolioResult {
    success: boolean;
    portfolioAddress?: string;
    transactionHash?: string;
    userOpHash?: string;
    error?: string;
}

/**
 * Deploy a new portfolio for a user via the PortfolioFactory
 * @param userSmartAccount - The user's smart account
 * @param rpcUrl - The RPC URL for the bundler
 * @param pimlicoClient - Pimlico client for gas estimation
 * @param paymasterClient - Optional paymaster client for gas sponsorship
 * @param chainId - The chain to deploy on (default: sepolia)
 * @returns Promise<DeployPortfolioResult>
 */
export const deployUserPortfolio = async (
    userSmartAccount: MetaMaskSmartAccount,
    rpcUrl: string,
    pimlicoClient: any,
    paymasterClient?: any,
    chainId: SupportedChain = "sepolia"
): Promise<DeployPortfolioResult> => {
    try {
        logger.info("Deploying portfolio for user", { userAddress: userSmartAccount.address, chainId });

        const chainConfig = getChainConfig(chainId);
        const chain = chainConfig.chain;

        // Get factory contract address
        const factoryAddress = await getContractAddressByName("PortfolioFactory_Sepolia");
        if (!factoryAddress) {
            return { success: false, error: "PortfolioFactory contract not found in database" };
        }

        // Create clients
        const publicClient = createPublicClient({ chain, transport: http() });
        const bundlerClient = createBundlerClient({ client: publicClient, transport: http(rpcUrl) });

        // Encode createPortfolio function call
        const createPortfolioCalldata = encodeFunctionData({
            abi: portfolioFactory.abi,
            functionName: "createPortfolio",
            args: [], // No arguments needed - factory uses msg.sender
        });

        // Estimate gas with fallback
        let gasParams: { maxFeePerGas: bigint; maxPriorityFeePerGas: bigint };
        try {
            const pimlicoFee = await pimlicoClient.getUserOperationGasPrice();
            gasParams = pimlicoFee.fast;
        } catch {
            const gasEstimate = await publicClient.estimateFeesPerGas();
            const buffer = 150n; // 50% buffer
            gasParams = {
                maxFeePerGas: (gasEstimate.maxFeePerGas * buffer) / 100n,
                maxPriorityFeePerGas: (gasEstimate.maxPriorityFeePerGas * buffer) / 100n,
            };
        }

        // Send UserOperation to create portfolio
        const userOpHash = await bundlerClient.sendUserOperation({
            account: userSmartAccount,
            calls: [
                {
                    to: factoryAddress,
                    value: 0n,
                    data: createPortfolioCalldata,
                },
            ],
            maxFeePerGas: gasParams.maxFeePerGas,
            maxPriorityFeePerGas: gasParams.maxPriorityFeePerGas,
            paymaster: paymasterClient,
        });

        logger.info("Portfolio creation UserOperation sent", userOpHash);

        // Wait for confirmation
        const { receipt } = await bundlerClient.waitForUserOperationReceipt({ hash: userOpHash });

        if (receipt.status !== "success") {
            return {
                success: false,
                error: `Portfolio creation failed: ${receipt.transactionHash}`,
                transactionHash: receipt.transactionHash
            };
        }

        // Get the created portfolio address from the factory
        const portfolioAddress = await getPortfolioAddressFromFactory(
            userSmartAccount.address,
            factoryAddress,
            publicClient
        );

        if (!portfolioAddress) {
            return {
                success: false,
                error: "Failed to get portfolio address from factory",
                transactionHash: receipt.transactionHash,
                userOpHash
            };
        }

        logger.info("Portfolio deployed successfully", portfolioAddress);

        return {
            success: true,
            portfolioAddress,
            transactionHash: receipt.transactionHash,
            userOpHash,
        };

    } catch (error) {
        logger.error("Error deploying portfolio", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error during portfolio deployment",
        };
    }
};

/**
 * Get user's portfolio address from the factory contract
 * @param userAddress - User's smart account address
 * @param factoryAddress - Factory contract address
 * @param publicClient - Viem public client (optional)
 * @param chainId - The chain to query (default: sepolia)
 * @returns Promise<string | null>
 */
export const getPortfolioAddressFromFactory = async (
    userAddress: `0x${string}`,
    factoryAddress: `0x${string}`,
    publicClient?: any,
    chainId: SupportedChain = "sepolia"
): Promise<string | null> => {
    try {
        if (!publicClient) {
            const chainConfig = getChainConfig(chainId);
            const chain = chainConfig.chain;
            publicClient = createPublicClient({ chain, transport: http() });
        }

        const portfolioAddress = await publicClient.readContract({
            address: factoryAddress,
            abi: portfolioFactory.abi,
            functionName: "getPortfolio",
            args: [userAddress],
        }) as `0x${string}`;

        // Return null if address is zero address (portfolio doesn't exist)
        if (portfolioAddress === "0x0000000000000000000000000000000000000000") {
            return null;
        }

        return portfolioAddress;
    } catch (error) {
        logger.error("Error getting portfolio address from factory", error);
        return null;
    }
};

/**
 * Check if user already has a portfolio deployed via factory
 * @param userAddress - User's smart account address
 * @param chainId - The chain to check (default: sepolia)
 * @returns Promise<boolean>
 */
export const hasPortfolioDeployed = async (
    userAddress: `0x${string}`,
    chainId: SupportedChain = "sepolia"
): Promise<boolean> => {
    try {
        const factoryAddress = await getContractAddressByName("PortfolioFactory");
        if (!factoryAddress) return false;

        const chainConfig = getChainConfig(chainId);
        const chain = chainConfig.chain;
        const publicClient = createPublicClient({ chain, transport: http() });
        const portfolioAddress = await getPortfolioAddressFromFactory(userAddress, factoryAddress, publicClient, chainId);

        return portfolioAddress !== null;
    } catch {
        return false;
    }
};
