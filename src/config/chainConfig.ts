import { Chain } from "viem";
import { monadTestnet, sepolia } from "viem/chains";
import { initializeWithValidation as initializeMonad } from "./metamask_monadtestnet_config.js";

export type SupportedChain = "monad" | "sepolia";

export interface ChainConfig {
    chain: Chain;
    chainId: number;
    name: string;
    initialize?: () => void;
}

export const SUPPORTED_CHAINS: Record<SupportedChain, ChainConfig> = {
    monad: {
        chain: monadTestnet,
        chainId: 10143,
        name: "Monad Testnet",
        initialize: initializeMonad,
    },
    sepolia: {
        chain: sepolia,
        chainId: 11155111,
        name: "Sepolia Testnet",
    },
};

/**
 * Get chain configuration by chain identifier
 * @param chainId - The chain identifier ("monad" or "sepolia")
 * @returns Chain configuration object
 */
export function getChainConfig(chainId: SupportedChain): ChainConfig {
    const config = SUPPORTED_CHAINS[chainId];
    if (!config) {
        throw new Error(`Unsupported chain: ${chainId}. Supported chains: ${Object.keys(SUPPORTED_CHAINS).join(", ")}`);
    }
    return config;
}

/**
 * Get all supported chain identifiers
 * @returns Array of supported chain identifiers
 */
export function getSupportedChains(): SupportedChain[] {
    return Object.keys(SUPPORTED_CHAINS) as SupportedChain[];
}

/**
 * Validate if a chain identifier is supported
 * @param chainId - The chain identifier to validate
 * @returns True if supported, false otherwise
 */
export function isValidChain(chainId: string): chainId is SupportedChain {
    return Object.keys(SUPPORTED_CHAINS).includes(chainId);
}

/**
 * Initialize MetaMask environment for a specific chain
 * @param chainId - The chain identifier
 */
export function initializeChainEnvironment(chainId: SupportedChain): void {
    const config = getChainConfig(chainId);
    config.initialize?.();
}

export default {
    SUPPORTED_CHAINS,
    getChainConfig,
    getSupportedChains,
    isValidChain,
    initializeChainEnvironment,
};
