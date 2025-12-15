import {createPublicClient, http} from "viem";
import {monadTestnet} from "viem/chains";

export const publicClient = createPublicClient({
    chain:monadTestnet,
    transport: http(),
});


