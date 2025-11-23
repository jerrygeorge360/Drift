import {
    createExecution,
    ExecutionMode,
    MetaMaskSmartAccount,
    createDelegation,
    contracts
} from "@metamask/smart-accounts-kit";

const { DelegationManager } = contracts;
import { encodeFunctionData, http, createPublicClient, erc20Abi } from "viem";
import smartPortfolio from "../../contracts/abi/SmartPortfolio.json" with { type: 'json' };
import { createBundlerClient } from "viem/account-abstraction";
import { monadTestnet as chain } from "viem/chains";

// Type definitions
import { RebalanceParams } from "../bot/bot.types.js";
import { RedeemResult } from "./types.js";

// Create a signed delegation with scopes
export const createSignedDelegation = async (
    delegatorSmartAccount: MetaMaskSmartAccount,
    delegateSmartAccount: MetaMaskSmartAccount,
    smartPortfolioAddress: `0x${string}`
) => {
    const delegation = createDelegation({
        from: delegatorSmartAccount.address,       // Alice, the delegator
        to: delegateSmartAccount.address,         // Bob, the delegate
        environment: delegatorSmartAccount.environment,
        scope: {
            type: "functionCall",
            targets: [smartPortfolioAddress],   // Must match exact contract
            selectors: [
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
    console.log("Preparing delegation redemption...");

    // Public client + bundler client
    const publicClient = createPublicClient({ chain, transport: http() });
    const bundlerClient = createBundlerClient({ client: publicClient, transport: http(rpcUrl) });

    // Encode the SmartPortfolio rebalance calldata
    const rebalanceCalldata = encodeFunctionData({
        abi: smartPortfolio.abi,
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
    const execution = createExecution({ target: smartPortfolioAddress, callData: rebalanceCalldata });
    const executions = [execution];  // Create array of executions

    // Encode redeemDelegations - both delegations and executions must be 2D arrays
    const redeemDelegationCalldata = DelegationManager.encode.redeemDelegations({
        delegations: [[signedDelegation]],       // Delegation[][]
        modes: [ExecutionMode.SingleDefault],
        executions: [executions],                // ExecutionStruct[][] - [ExecutionStruct[]]
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

    console.log("Sending user operation with gas params:", gasParams);

    // Send UserOperation as delegate (Bob)
    const userOpHash = await bundlerClient.sendUserOperation({
        account: delegateSmartAccount,          // delegate executes
        calls: [{ to: delegateSmartAccount.address, data: redeemDelegationCalldata }],
        maxFeePerGas: gasParams.maxFeePerGas,
        maxPriorityFeePerGas: gasParams.maxPriorityFeePerGas,
        paymaster: paymasterClient,
    });

    console.log("UserOperation sent:", userOpHash);

    // Wait for confirmation
    const { receipt } = await bundlerClient.waitForUserOperationReceipt({ hash: userOpHash });
    console.log("UserOperation receipt:", receipt);
    if (receipt.status !== "success") throw new Error(`Transaction reverted: ${receipt.transactionHash}`);

    return {
        userOpHash,
        transactionHash: receipt.transactionHash,
        blockNumber: receipt.blockNumber,
        status: "success",
        gasUsed: receipt.gasUsed,
    };
};

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
    rpcUrl: string,
    pimlicoClient: any,
    paymasterClient?: any
): Promise<{ deployed: boolean; transactionHash?: string; alreadyDeployed?: boolean }> => {
    console.log("Checking smart account deployment status...");

    // Create clients
    const publicClient = createPublicClient({ chain, transport: http() });
    const bundlerClient = createBundlerClient({ client: publicClient, transport: http(rpcUrl) });

    // Check if the smart account is already deployed
    const bytecode = await publicClient.getCode({ address: smartAccount.address });

    if (bytecode && bytecode !== '0x') {
        console.log("Smart account already deployed:", smartAccount.address);
        return { deployed: true, alreadyDeployed: true };
    }

    console.log("Deploying smart account:", smartAccount.address);

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
        maxFeePerGas: gasParams.maxFeePerGas,
        maxPriorityFeePerGas: gasParams.maxPriorityFeePerGas,
        paymaster: paymasterClient,
    });

    console.log("Deployment UserOperation sent:", userOpHash);

    // Wait for confirmation
    const { receipt } = await bundlerClient.waitForUserOperationReceipt({ hash: userOpHash });

    if (receipt.status !== "success") {
        throw new Error(`Deployment failed: ${receipt.transactionHash}`);
    }

    console.log("Smart account deployed successfully:", smartAccount.address);
    console.log("Transaction hash:", receipt.transactionHash);

    return {
        deployed: true,
        transactionHash: receipt.transactionHash,
        alreadyDeployed: false,
    };
};