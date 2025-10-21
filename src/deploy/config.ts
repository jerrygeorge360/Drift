import { createPublicClient, http } from "viem";
import { createBundlerClient,createPaymasterClient } from "viem/account-abstraction";
import { sepolia as chain } from "viem/chains";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import {
    Implementation,
    toMetaMaskSmartAccount,
} from "@metamask/delegation-toolkit";


const publicClient = createPublicClient({
    chain,
    transport: http()
});

const privateKey = generatePrivateKey();
const account = privateKeyToAccount(privateKey);

export const smartAccount = await toMetaMaskSmartAccount({
    client: publicClient,
    implementation: Implementation.Hybrid,
    deployParams: [account.address, [], [], []],
    deploySalt: "0x",
    signer: { account },
});

export const bundlerClient = createBundlerClient({
    client: publicClient,
    transport: http("https://api.pimlico.io/v2/11155111/rpc?apikey=pim_8WB5fpjMyDDc2gc4o88k3x")
});


export const paymasterClient = createPaymasterClient({
    // You can use the paymaster of your choice
    transport: http("https://api.pimlico.io/v2/11155111/rpc?apikey=pim_8WB5fpjMyDDc2gc4o88k3x")
});