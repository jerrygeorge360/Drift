import {
    createExecution,
    ExecutionMode,
    MetaMaskSmartAccount,
    createDelegation
} from "@metamask/delegation-toolkit";
import { DelegationManager } from "@metamask/delegation-toolkit/contracts";
import { encodeFunctionData, http, createPublicClient } from "viem";
import smartPortfolio from "../../contracts/abi/SmartPortfolio.json" with { type: 'json' };
import { smartPortfolioScope } from "../../config/delegationConfig.js";
import { createBundlerClient } from "viem/account-abstraction";
import { monadTestnet as chain } from "viem/chains";

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
 * Redeem delegation with better gas handling + bundler pattern
 */
export const redeemDelegation = async (
    signedDelegation: any,
    delegateSmartAccount: MetaMaskSmartAccount,
    smartPortfolioAddress: `0x${string}`,
    rebalanceParams: RebalanceParams,
    rpcUrl: string,
    pimlicoClient: any,
    paymasterClient?: any
): Promise<RedeemResult> => {
    try {
        console.log(`🔄 Preparing rebalance delegation...`);

        // 1️⃣ Initialize bundler + public client
        const publicClient = createPublicClient({
            chain,
            transport: http(),
        });

        const bundlerClient = createBundlerClient({
            client: publicClient,
            transport: http(rpcUrl),
        });

        // 2️⃣ Encode the SmartPortfolio rebalance calldata
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

        // 3️⃣ Create execution for the SmartPortfolio contract
        const executions = createExecution({
            target: smartPortfolioAddress,
            callData: rebalanceCalldata,
        });

        // 4️⃣ Encode redeemDelegations calldata
        const redeemDelegationCalldata = DelegationManager.encode.redeemDelegations({
            delegations:[signedDelegation],
            modes: [ExecutionMode.SingleDefault],
            executions: [[executions]],
        });

        // 5️⃣ Handle gas estimation or Pimlico fallback
        let gasParams: { maxFeePerGas: bigint; maxPriorityFeePerGas: bigint };

        try {
            const pimlicoFee = await pimlicoClient.getUserOperationGasPrice();
            console.log("✅ Pimlico gas price:", pimlicoFee);
            gasParams = pimlicoFee.fast;
        } catch (err) {
            console.warn("⚠️ Pimlico gas price failed, using fallback:", err);
            const gasEstimate = await publicClient.estimateFeesPerGas();
            const buffer = 150n; // +50%
            gasParams = {
                maxFeePerGas: (gasEstimate.maxFeePerGas * buffer) / 100n,
                maxPriorityFeePerGas: (gasEstimate.maxPriorityFeePerGas * buffer) / 100n,
            };
        }

        console.log("🚀 Redeeming delegation with gas params:", gasParams);

        // 6️⃣ Send the user operation
        const userOpHash = await bundlerClient.sendUserOperation({
            account: delegateSmartAccount,
            calls: [
                {
                    to: delegateSmartAccount.address,
                    data: redeemDelegationCalldata,
                },
            ],
            maxFeePerGas: gasParams.maxFeePerGas,
            maxPriorityFeePerGas: gasParams.maxPriorityFeePerGas,
            paymaster: paymasterClient,
        });

        console.log("📤 Sent User Operation:", userOpHash);
        console.log("⏳ Waiting for confirmation...");

        // 7️⃣ Wait for the user operation receipt
        const { receipt } = await bundlerClient.waitForUserOperationReceipt({
            hash: userOpHash,
        });

        console.log("✅ Delegation redeemed!");
        console.log("   TX Hash:", receipt.transactionHash);
        console.log("   Block:", receipt.blockNumber);
        console.log("   Status:", receipt.status);

        const status = receipt.status === "success" ? "success" : "reverted";
        if (status === "reverted") {
            throw new Error(`Transaction reverted: ${receipt.transactionHash}`);
        }

        return {
            userOpHash,
            transactionHash: receipt.transactionHash,
            blockNumber: receipt.blockNumber,
            status,
            gasUsed: receipt.gasUsed,
        };
    } catch (error: any) {
        console.error("❌ Failed to redeem delegation:", error);
        throw new Error(`Delegation redemption failed: ${error.message}`);
    }
};
