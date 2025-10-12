
import {sepolia as chain} from "viem/chains";
import { http, createPublicClient } from "viem";
import { createBundlerClient } from "viem/account-abstraction"


const transport = http();
export const publicClient = createPublicClient({
    transport,
    chain,
});


export const bundlerClient = createBundlerClient({
    client: publicClient,
    transport: http("https://your-bundler-rpc.com"),
})