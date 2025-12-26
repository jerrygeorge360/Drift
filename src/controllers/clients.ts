import {createPublicClient, http} from "viem";
import {monadTestnet,sepolia} from "viem/chains";

export const publicClient = createPublicClient({
    chain:monadTestnet,
    transport: http(),
});


