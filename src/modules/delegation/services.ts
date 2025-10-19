import {
    createDelegation,
    createExecution,
    ExecutionMode,
    MetaMaskSmartAccount
} from "@metamask/delegation-toolkit";
import { DelegationManager } from "@metamask/delegation-toolkit/contracts";
import { encodeFunctionData } from "viem";
import { bundlerClient } from "../../controllers/clients.js";
import smartPortfolio from "../../contracts/abi/SmartPortfolio.json" with { type: 'json' };
import { smartPortfolioScope } from "../../config/delegationConfig.js";

// Type definitions
interface RebalanceParams {
    botAddress: `0x${string}`;
    tokenIn: `0x${string}`;
    tokenOut: `0x${string}`;
    amountOut: bigint;
    amountInMin: bigint;
    swapPath: `0x${string}`[];
    reason: string;
}

interface RedeemResult {
    userOpHash: `0x${string}`;
    transactionHash: `0x${string}`;
    blockNumber: bigint;
    status: "success" | "reverted";
    gasUsed?: bigint;
}

/**
 * Create a signed delegation
 */
export const createSignedDelegation = async (
    delegatorSmartAccount: MetaMaskSmartAccount,
    delegateSmartAccount: MetaMaskSmartAccount
) => {
    const delegation = createDelegation({
        to: delegateSmartAccount.address,
        from: delegatorSmartAccount.address,
        environment: delegatorSmartAccount.environment,
        scope: smartPortfolioScope,
    });

    const signature = await delegatorSmartAccount.signDelegation({
        delegation,
    });

    return {
        ...delegation,
        signature,
    };
};

/**
 * Redeem delegation with full transaction receipt (FULL MODE)
 * Waits for transaction confirmation and returns complete details
 */
export const redeemDelegation = async (
    signedDelegation: any,
    delegateSmartAccount: MetaMaskSmartAccount,
    smartPortfolioAddress: `0x${string}`,
    rebalanceParams: RebalanceParams
): Promise<RedeemResult> => {
    try {
        const delegations = [signedDelegation];

        console.log(`🔄 Encoding rebalance calldata...`);

        // Encode the executeRebalance function call
        const rebalanceCalldata = encodeFunctionData({
            abi: smartPortfolio.abi,
            functionName: "executeRebalance",
            args: [
                rebalanceParams.botAddress,
                rebalanceParams.tokenIn,
                rebalanceParams.tokenOut,
                rebalanceParams.amountOut,
                rebalanceParams.amountInMin,
                rebalanceParams.swapPath,
                rebalanceParams.reason,
            ],
        });

        // Create execution targeting the SmartPortfolio contract
        const executions = createExecution({
            target: smartPortfolioAddress,
            value: 0n,
            callData: rebalanceCalldata,
        });

        console.log(`📦 Encoding redemption calldata...`);

        const redeemDelegationCalldata = DelegationManager.encode.redeemDelegations({
            delegations: [delegations],
            modes: [ExecutionMode.SingleDefault],
            executions: [[executions]],
        });

        console.log(`📤 Submitting user operation...`);

        // Send user operation
        const userOpHash = await bundlerClient.sendUserOperation({
            account: delegateSmartAccount,
            calls: [
                {
                    to: delegateSmartAccount.address,
                    data: redeemDelegationCalldata,
                },
            ],
        });

        console.log(`⏳ User Operation Hash: ${userOpHash}`);
        console.log(`   Waiting for confirmation...`);

        // Wait for the user operation to be included in a transaction
        const receipt = await bundlerClient.waitForUserOperationReceipt({
            hash: userOpHash,
        });

        console.log(`✅ Transaction confirmed!`);
        console.log(`   TX Hash: ${receipt.receipt.transactionHash}`);
        console.log(`   Block: ${receipt.receipt.blockNumber}`);
        console.log(`   Status: ${receipt.receipt.status}`);

        // Check if transaction was successful
        const status = receipt.receipt.status === "success" ? "success" : "reverted";

        if (status === "reverted") {
            throw new Error(`Transaction reverted: ${receipt.receipt.transactionHash}`);
        }

        return {
            userOpHash,
            transactionHash: receipt.receipt.transactionHash,
            blockNumber: receipt.receipt.blockNumber,
            status,
            gasUsed: receipt.receipt.gasUsed,
        };
    } catch (error: any) {
        console.error("❌ Failed to redeem delegation:", error);

        // Provide more context in the error
        if (error.message?.includes("reverted")) {
            throw new Error(`Transaction reverted: ${error.message}`);
        } else if (error.message?.includes("timeout")) {
            throw new Error(`Transaction timeout: User operation took too long to confirm`);
        } else {
            throw new Error(`Delegation redemption failed: ${error.message}`);
        }
    }
};

/**
 * Redeem delegation without waiting (FAST MODE)
 * Returns immediately with only the user operation hash
 */
export const redeemDelegationFast = async (
    signedDelegation: any,
    delegateSmartAccount: MetaMaskSmartAccount,
    smartPortfolioAddress: `0x${string}`,
    rebalanceParams: RebalanceParams
): Promise<`0x${string}`> => {
    try {
        const delegations = [signedDelegation];

        // Encode the executeRebalance function call
        const rebalanceCalldata = encodeFunctionData({
            abi: smartPortfolio.abi,
            functionName: "executeRebalance",
            args: [
                rebalanceParams.botAddress,
                rebalanceParams.tokenIn,
                rebalanceParams.tokenOut,
                rebalanceParams.amountOut,
                rebalanceParams.amountInMin,
                rebalanceParams.swapPath,
                rebalanceParams.reason,
            ],
        });

        // Create execution targeting the SmartPortfolio contract
        const executions = createExecution({
            target: smartPortfolioAddress,
            value: 0n,
            callData: rebalanceCalldata,
        });

        const redeemDelegationCalldata = DelegationManager.encode.redeemDelegations({
            delegations: [delegations],
            modes: [ExecutionMode.SingleDefault],
            executions: [[executions]],
        });

        // Send user operation and return immediately
        return await bundlerClient.sendUserOperation({
            account: delegateSmartAccount,
            calls: [
                {
                    to: delegateSmartAccount.address,
                    data: redeemDelegationCalldata,
                },
            ],
        });
    } catch (error: any) {
        console.error("❌ Failed to redeem delegation (fast mode):", error);
        throw new Error(`Delegation redemption failed: ${error.message}`);
    }
};

// Export types
export type { RebalanceParams, RedeemResult };