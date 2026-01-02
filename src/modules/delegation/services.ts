import {
    createExecution,
    ExecutionMode,
    MetaMaskSmartAccount,
    createDelegation,
    contracts
} from "@metamask/smart-accounts-kit";

const { DelegationManager } = contracts;
import { encodeFunctionData, http, createPublicClient, erc20Abi, zeroAddress } from "viem";
import userPortfolio from "../../contracts/abi/UserPortfolio.json" with { type: 'json' };
import { createBundlerClient } from "viem/account-abstraction";
import { sepolia as chain } from "viem/chains";

// Type definitions
import { RebalanceParams } from "../bot/bot.types.js";
import { RedeemResult } from "./types.js";
import { getPortfolioAddressBySmartAccountId } from "../../utils/dbhelpers.js";
import { logger } from "../../utils/logger.js";

// Create a signed delegation with scopes
export const createSignedDelegation = async (
    delegatorSmartAccount: MetaMaskSmartAccount,
    delegateSmartAccount: MetaMaskSmartAccount,
    smartPortfolioAddress: `0x${string}`,
    tokenAddresses: `0x${string}`[]
) => {
    const delegation = createDelegation({
        from: delegatorSmartAccount.address,       // Alice, the delegator
        to: delegateSmartAccount.address,         // Bob, the delegate
        environment: delegatorSmartAccount.environment,
        scope: {
            type: "functionCall",
            targets: [...tokenAddresses, smartPortfolioAddress],   // Must match exact contract
            selectors: [
                "approve(address,uint256)",
                "executeRebalance(address,address,address,uint256,uint256,address[],string)"
            ],
        },
    });

    const signature = await delegatorSmartAccount.signDelegation({
        delegation,
    });

    return {
        ...delegation,
        signature,
    };
};

export const redeemDelegation = async (
    signedDelegation: any,
    delegateSmartAccount: MetaMaskSmartAccount,
    smartPortfolioAddress: `0x${string}`,
    rebalanceParams: RebalanceParams,
    rpcUrl: string,
    pimlicoClient: any,
    paymasterClient?: any
): Promise<RedeemResult> => {
    logger.info("Preparing delegation redemption...");

    // Public client + bundler client
    const publicClient = createPublicClient({ chain, transport: http() });
    const bundlerClient = createBundlerClient({ client: publicClient, transport: http(rpcUrl) });

    // Encode the ERC20 token approve calldata
    const approveCalldata = encodeFunctionData({
        abi: [
            {
                name: 'approve',
                type: 'function',
                stateMutability: 'nonpayable',
                inputs: [
                    { name: 'spender', type: 'address' },
                    { name: 'amount', type: 'uint256' }
                ],
                outputs: [{ type: 'bool' }]
            }
        ],
        functionName: 'approve',
        args: [smartPortfolioAddress, rebalanceParams.amountIn]
    });

    const approvalExecution = createExecution({
        target: rebalanceParams.tokenIn as `0x${string}`,
        callData: approveCalldata
    });

    // Encode the SmartPortfolio rebalance calldata
    const rebalanceCalldata = encodeFunctionData({
        abi: userPortfolio.abi,
        functionName: "executeRebalance",
        args: [
            rebalanceParams.botAddress,
            rebalanceParams.tokenIn,
            rebalanceParams.tokenOut,
            rebalanceParams.amountIn,
            rebalanceParams.amountOutMin,
            rebalanceParams.swapPath,
            rebalanceParams.reason
        ],
    });

    // Create execution for this transaction
    const rebalanceExecution = createExecution({ target: smartPortfolioAddress, callData: rebalanceCalldata });


    const redeemApprovalCalldata = DelegationManager.encode.redeemDelegations({
        delegations: [[signedDelegation]],
        modes: [ExecutionMode.SingleDefault],
        executions: [[approvalExecution]],
    });
    // Encode redeemDelegations - both delegations and executions must be 2D arrays
    const redeemDelegationCalldata = DelegationManager.encode.redeemDelegations({
        delegations: [[signedDelegation]],       // Delegation[][]
        modes: [ExecutionMode.SingleDefault],
        executions: [[rebalanceExecution]],                // ExecutionStruct[][] - [ExecutionStruct[]]
    });

    // Estimate gas or fallback to Pimlico
    let gasParams: { maxFeePerGas: bigint; maxPriorityFeePerGas: bigint };
    try {
        const pimlicoFee = await pimlicoClient.getUserOperationGasPrice();
        gasParams = pimlicoFee.fast;
    } catch {
        const gasEstimate = await publicClient.estimateFeesPerGas();
        const buffer = 150n;
        gasParams = {
            maxFeePerGas: (gasEstimate.maxFeePerGas * buffer) / 100n,
            maxPriorityFeePerGas: (gasEstimate.maxPriorityFeePerGas * buffer) / 100n,
        };
    }

    logger.info("Sending user operation with gas params");

    // STEP 1: Send approval UserOperation
    const approvalOpHash = await bundlerClient.sendUserOperation({
        account: delegateSmartAccount,
        calls: [{ to: delegateSmartAccount.address, data: redeemApprovalCalldata }],
        maxFeePerGas: gasParams.maxFeePerGas,
        maxPriorityFeePerGas: gasParams.maxPriorityFeePerGas,
        paymaster: paymasterClient,
    });

    logger.info("Approval UserOperation sent");

    // Wait for approval confirmation
    const approvalReceipt = await bundlerClient.waitForUserOperationReceipt({ hash: approvalOpHash });
    logger.info("Approval receipt received");

    if (approvalReceipt.receipt.status !== "success") {
        throw new Error(`Approval transaction reverted: ${approvalReceipt.receipt.transactionHash}`);
    }

    logger.info("✅ Approval successful, now sending rebalance operation...");

    // Send UserOperation as delegate (Bob)
    const userOpHash = await bundlerClient.sendUserOperation({
        account: delegateSmartAccount,          // delegate executes
        calls: [{ to: delegateSmartAccount.address, data: redeemDelegationCalldata }],
        maxFeePerGas: gasParams.maxFeePerGas,
        maxPriorityFeePerGas: gasParams.maxPriorityFeePerGas,
        paymaster: paymasterClient,
    });

    logger.info("UserOperation sent");

    // Wait for confirmation
    const { receipt } = await bundlerClient.waitForUserOperationReceipt({ hash: userOpHash });
    logger.info("UserOperation receipt received");
    if (receipt.status !== "success") throw new Error(`Transaction reverted: ${receipt.transactionHash}`);

    return {
        userOpHash,
        transactionHash: receipt.transactionHash,
        blockNumber: receipt.blockNumber.toString(),
        status: "success",
        gasUsed: receipt.gasUsed.toString(),
    };
};

// TODOOOOO:::::::::::::: add validation
/**
 * Automatically deploy a smart account on-chain if it hasn't been deployed yet.
 * This function sends a minimal no-op UserOperation to trigger deployment.
 * 
 * @param smartAccount - The MetaMask smart account to deploy
 * @param rpcUrl - The RPC URL for the bundler
 * @param pimlicoClient - Pimlico client for gas estimation
 * @param paymasterClient - Optional paymaster client for gas sponsorship
 * @returns Promise<{ deployed: boolean; transactionHash?: string; alreadyDeployed?: boolean }>
 */
export const autoDeploySmartAccount = async (
    smartAccount: MetaMaskSmartAccount,
    publicClient: any,
    bundlerClient: any,
    pimlicoClient: any,
    paymasterClient?: any
): Promise<{ deployed: boolean; transactionHash?: string; alreadyDeployed?: boolean }> => {

    logger.info("Deploying smart account", smartAccount.address);

    // Estimate gas with fallback
    let gasParams: { maxFeePerGas: bigint; maxPriorityFeePerGas: bigint };
    try {
        const pimlicoFee = await pimlicoClient.getUserOperationGasPrice();
        logger.info("Pimlico gas prices received");
        gasParams = pimlicoFee.fast;
    } catch {
        const gasEstimate = await publicClient.estimateFeesPerGas();
        const buffer = 150n; // 50% buffer
        gasParams = {
            maxFeePerGas: (gasEstimate.maxFeePerGas * buffer) / 100n,
            maxPriorityFeePerGas: (gasEstimate.maxPriorityFeePerGas * buffer) / 100n,
        };
    }

    // Send a minimal no-op UserOperation to trigger deployment
    const userOpHash = await bundlerClient.sendUserOperation({
        account: smartAccount,
        calls: [
            {
                to: smartAccount.address, // Send to self
                value: 0n,
                data: "0x",
            },
        ],
        callGasLimit: 1000000n,        // Gas for the actual call execution
        verificationGasLimit: 3000000n, // Gas for account verification/deployment
        preVerificationGas: 300000n,   // Fixed gas for pre-verification
        paymasterVerificationGasLimit: 500000n, // Gas for paymaster verification
        paymasterPostOpGasLimit: 100000n,       // Gas for paymaster post-operation
        maxFeePerGas: gasParams.maxFeePerGas,
        maxPriorityFeePerGas: gasParams.maxPriorityFeePerGas,
        paymaster: paymasterClient,
    });

    logger.info("Deployment UserOperation sent");

    // Wait for confirmation
    const { receipt } = await bundlerClient.waitForUserOperationReceipt({ hash: userOpHash });

    if (receipt.status !== "success") {
        throw new Error(`Deployment failed: ${receipt.transactionHash}`);
    }

    logger.info("Smart account deployed successfully", smartAccount.address);
    logger.info("Transaction hash received");

    return {
        deployed: true,
        transactionHash: receipt.transactionHash,
        alreadyDeployed: false,
    };
};

/**
 * Get user's portfolio address for delegation
 * @param smartAccountId - User's smart account ID
 * @returns Promise<string | null>
 */
export const getUserPortfolioAddress = async (smartAccountId: string): Promise<`0x${string}` | null> => {
    try {
        // First try to get from database
        const portfolioAddress = await getPortfolioAddressBySmartAccountId(smartAccountId);
        if (portfolioAddress) {
            return portfolioAddress as `0x${string}`;
        }

        // If not in database, try to get from factory contract
        // TODO: Implement factory lookup when needed
        logger.warn("Portfolio address not found in database for smartAccountId", smartAccountId);
        return null;
    } catch (error) {
        logger.error("Error getting portfolio address", error);
        return null;
    }
};

//DONE : organize this