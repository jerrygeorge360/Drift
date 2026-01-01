import {createPublicClient, http, Chain} from "viem";
import {monadTestnet, sepolia} from "viem/chains";
import { SupportedChain, getChainConfig } from "../config/chainConfig.js";

// Default public client for monad testnet (for backward compatibility)
export const publicClient = createPublicClient({
    chain: sepolia,
    transport: http(),
});

/**
 * Create a public client for a specific chain
 * @param chainId - The chain identifier
 * @param rpcUrl - Optional RPC URL, if not provided uses default
 * @returns Public client instance
 */
export function createChainClient(chainId: SupportedChain, rpcUrl?: string) {
    const config = getChainConfig(chainId);
    
    return createPublicClient({
        chain: config.chain,
        transport: http(rpcUrl),
    });
}

/**
 * Get chain object by chain identifier
 * @param chainId - The chain identifier
 * @returns Viem chain object
 */
export function getChain(chainId: SupportedChain): Chain {
    return getChainConfig(chainId).chain;
}


