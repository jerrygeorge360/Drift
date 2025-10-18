import {createDelegation, createExecution, ExecutionMode, MetaMaskSmartAccount} from "@metamask/delegation-toolkit";
import {DelegationManager} from "@metamask/delegation-toolkit/contracts"
import {encodeFunctionData} from "viem"
import {bundlerClient} from "../../controllers/clients.js";
import smartPortfolio from "../../contracts/abi/SmartPortfolio.json" with { type: 'json' };
import {RebalanceParams} from "../bot/bot.delegation.js";
import {smartPortfolioScope} from "../../config/delegationConfig.js";


// create delegation
export const createSignedDelegation = async (delegatorSmartAccount:MetaMaskSmartAccount,delegateSmartAccount:MetaMaskSmartAccount)=>{
    const delegation= createDelegation({
        to: delegateSmartAccount.address,
        from: delegatorSmartAccount.address,
        environment: delegatorSmartAccount.environment,
        scope: smartPortfolioScope,
    })

    const signature = await delegatorSmartAccount.signDelegation({
        delegation,
    })

    return {
        ...delegation,
        signature,
    }
}


// redeem the delegation
export const redeemDelegation = async (signedDelegation:any,delegateSmartAccount:MetaMaskSmartAccount,smartPortfolioAddress:`0x${string}`,  rebalanceParams:RebalanceParams)=>{
try {
    const delegations = [signedDelegation]

    // Encode the executeRebalance function call
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
        ]
    });

    // Create execution targeting the SmartPortfolio contract
    const executions = createExecution({
        target: smartPortfolioAddress,
        value: 0n,
        callData: rebalanceCalldata
    });

    const redeemDelegationCalldata = DelegationManager.encode.redeemDelegations({
        delegations: [delegations],
        modes: [ExecutionMode.SingleDefault],
        executions: [[executions]],
    })


    return await bundlerClient.sendUserOperation({
        account: delegateSmartAccount,
        calls: [
            {
                to: delegateSmartAccount.address,
                data: redeemDelegationCalldata,
            },
        ],

    });
}
catch (error) {
    console.error("Failed to redeem delegation:", error);
    throw error;
}

}