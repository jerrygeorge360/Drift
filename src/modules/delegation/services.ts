import {createDelegation, createExecution, ExecutionMode, MetaMaskSmartAccount} from "@metamask/delegation-toolkit";
import {DelegationManager} from "@metamask/delegation-toolkit/contracts"
import {zeroAddress} from "viem"
import {bundlerClient} from "../../controllers/clients.js";


// create delegation
export const createSignedDelegation = async (delegatorSmartAccount:MetaMaskSmartAccount,delegateSmartAccount:MetaMaskSmartAccount,scope: any)=>{
    const delegation= createDelegation({
        to: delegateSmartAccount.address,
        from: delegatorSmartAccount.address,
        environment: delegatorSmartAccount.environment,
        scope: scope,
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
export const redeemDelegation = async (signedDelegation:any,delegateSmartAccount:MetaMaskSmartAccount)=>{

    const delegations = [signedDelegation]

    const executions = createExecution({ target: zeroAddress })

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
        maxFeePerGas: 1n,
        maxPriorityFeePerGas: 1n,
    });
}