// src/aaSetup.ts
import { createPublicClient, http, zeroAddress } from "viem";
import { createBundlerClient, createPaymasterClient } from "viem/account-abstraction";
import { createPimlicoClient } from "permissionless/clients/pimlico";
import {reconstructSmartAccount} from "../utils/delegationhelpers.js";
import {findSmartAccountById} from "../utils/dbhelpers.js";
import {decryptPrivateKey} from "../utils/encryption.js";
import {monadTestnet} from "viem/chains";

export interface AASetupOptions {
    chain: any;                    // viem chain object, e.g. sepolia, mainnet, polygon
    rpcUrl: string;                 // RPC endpoint for bundler/paymaster
    pimlicoApiKey?: string;         // optional, if using Pimlico
    smartAccountId: string;
}

/**
 * Create an Account-Abstraction setup for a given chain.
 */
export async function createAASetup({ chain, rpcUrl, pimlicoApiKey,smartAccountId }: AASetupOptions) {
    // 1️⃣ Public client
    console.log(rpcUrl);
    const publicClient = createPublicClient({
        chain,
        transport: http(rpcUrl),
    });

    // 2️⃣ Create a local signer/account
    const privateKey = await findSmartAccountById(smartAccountId);

    if (!privateKey) {
        throw new Error(`can't find privateKey for ${smartAccountId}`);
    }
    const decryptedPrivateKey =  decryptPrivateKey(privateKey.privateKey);




    // Smart account

    const smartAccount = await reconstructSmartAccount(decryptedPrivateKey)

    // Bundler client
    const bundlerClient = createBundlerClient({
        client: publicClient,
        transport: http(rpcUrl),
    });

    // Paymaster client
    const paymasterClient = createPaymasterClient({
        transport: http(rpcUrl),
    });

    // Pimlico client
    let pimlicoClient = undefined;
    if (pimlicoApiKey) {
        pimlicoClient = createPimlicoClient({
            chain:monadTestnet,
            transport: http(rpcUrl),
        });
    }

    return {
        publicClient,
        smartAccount,
        bundlerClient,
        paymasterClient,
        pimlicoClient,
        zeroAddress,
    };
}
