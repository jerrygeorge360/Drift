// src/aaSetup.ts
import { createPublicClient, http, zeroAddress } from "viem";
import { createBundlerClient, createPaymasterClient } from "viem/account-abstraction";
import { createPimlicoClient } from "permissionless/clients/pimlico";


export interface AASetupOptions {
    chain: any;                    // viem chain object, e.g. sepolia, mainnet, polygon
    rpcUrl: string;                 // RPC endpoint for bundler/paymaster
    pimlicoUrl: string;         // optional, if using Pimlico
}

/**
 * Create an Account-Abstraction setup for a given chain.
 */
export async function setupAccountAbstractionClients({ chain, rpcUrl, pimlicoUrl}: AASetupOptions) {
    const publicClient = createPublicClient({
        chain,
        transport: http(rpcUrl),
    });

    const bundlerClient = createBundlerClient({
        chain,
        transport: http(pimlicoUrl),
    });

    // Paymaster client
    const paymasterClient = createPaymasterClient({
        transport: http(pimlicoUrl),
    });

    // Pimlico client
    let pimlicoClient = undefined;
    if (pimlicoUrl) {
        pimlicoClient = createPimlicoClient({
            chain,
            transport: http(pimlicoUrl),
        });
    }

    return {
        publicClient,
        bundlerClient,
        paymasterClient,
        pimlicoClient,
        zeroAddress,
    };
}


// DONE : would move the deploy/ folder here