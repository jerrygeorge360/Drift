import 'dotenv/config';
import {monadTestnet as chain} from "viem/chains";
import { http, createPublicClient } from "viem";
import { createBundlerClient } from "viem/account-abstraction"

const PIMLICO_API_KEY = process.env.PIMLICO_API_KEY;

if (!PIMLICO_API_KEY) {
    throw new Error("PIMLICO_API_KEY is not set in .env file");
}
export const publicClient = createPublicClient({
    chain,
    transport:http(),

});


export const bundlerClient = createBundlerClient({
    client: publicClient,
    paymaster: true,
    transport: http(`https://api.pimlico.io/v2/10143/rpc?apikey=${PIMLICO_API_KEY}`),
    userOperation: {
        async estimateFeesPerGas() {
            // Get current gas price from the publicClient
            const gasPrice = await publicClient.getGasPrice();

            // Set maxFeePerGas to 150% of current gas price for buffer
            const maxFeePerGas = (gasPrice * 150n) / 100n;

            // Set priority fee (tip to validators)
            const maxPriorityFeePerGas = gasPrice / 10n; // 10% of gas price as tip

            return {
                maxFeePerGas,
                maxPriorityFeePerGas,
            };
        }
    }
})