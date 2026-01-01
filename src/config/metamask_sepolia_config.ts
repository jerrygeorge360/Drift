import { SmartAccountsEnvironment } from "@metamask/smart-accounts-kit";
import { overrideDeployedEnvironment } from "@metamask/smart-accounts-kit/utils";

/**
 * Sepolia Testnet Configuration for MetaMask Smart Accounts Kit
 * 
 * This configuration sets up the smart account infrastructure for Sepolia testnet,
 * including factory contracts, delegation manager, and implementation contracts.
 */

// Sepolia Testnet Chain ID
export const SEPOLIA_TESTNET_CHAIN_ID = 11155111;

// MetaMask Smart Accounts Kit version (matches package.json)
export const METAMASK_KIT_VERSION = "0.1.0";

/**
 * Smart Accounts Environment configuration for Sepolia Testnet
 * These are the deployed contract addresses on Sepolia testnet
 * Note: These addresses need to be updated with actual deployed contracts on Sepolia
 */
const sepoliaTestnetEnvironment: SmartAccountsEnvironment = {
    // Simple Factory contract for creating smart accounts
    // TODO: Deploy this contract on Sepolia and update the address
    SimpleFactory: "0x69Aa2f9fe1572F1B640E1bbc512f5c3a734fc77c",
    
    // Delegation Manager contract for handling delegation permissions
    // TODO: Deploy this contract on Sepolia and update the address
    DelegationManager: "0x04b8a285e512fd6f3901a9672a6c9ae5ec8a22ec",

    // EntryPoint contract (ERC-4337 EntryPoint v0.6.0) - Standard address across networks
    EntryPoint: "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789",

    // Caveat enforcers used for policy/caveat enforcement
    // TODO: Deploy these contracts on Sepolia and update the addresses
    caveatEnforcers: {
        AllowedCalldataEnforcer: "0xc2b0d624c1c4319760C96503BA27C347F3260f55",
        AllowedMethodsEnforcer: "0x2c21fD0Cb9DC8445CB3fb0DC5E7Bb0Aca01842B5",
        ERC20BalanceChangeEnforcer: "0xcdF6aB796408598Cea671d79506d7D48E97a5437",
        ERC721TransferEnforcer: "0x3790e6B7233f779b09DA74C72b6e94813925b9aF",
    },

    // Implementation contracts for different smart account types
    // TODO: Deploy these contracts on Sepolia and update the addresses
    implementations: {
        // Hybrid implementation (combines features of different account types)
        Hybrid: "0x8ed2a135d37d196b47a6ee2b349959e770040aa3",
        
        // MultiSig implementation for multi-signature accounts
        MultiSig: "0x2618a497ae6fda0600060fbbb2d3e9ea81904087",

        // EIP-7702 Stateless implementation
        EIP7702Stateless: "0x31e851ddd4c2dd475315bc8449a40e4b44cc3ae2",
    },
};

/**
 * Initialize MetaMask Smart Accounts Kit environment for Sepolia Testnet
 * 
 * This function configures the MetaMask Smart Accounts Kit to work with
 * the Sepolia testnet by overriding the default environment with custom
 * contract addresses.
 * 
 * @throws {Error} If the environment override fails
 */
export function initializeSepoliaEnvironment(): void {
    try {
        // Override the deployed environment with Sepolia testnet configuration
        overrideDeployedEnvironment(
            SEPOLIA_TESTNET_CHAIN_ID,     // Chain ID for Sepolia testnet
            METAMASK_KIT_VERSION as any,  // Framework version
            sepoliaTestnetEnvironment     // Custom environment configuration
        );
        
        console.log("✅ MetaMask Smart Accounts Kit configured for Sepolia Testnet");
        console.log(`   Chain ID: ${SEPOLIA_TESTNET_CHAIN_ID}`);
        console.log(`   Kit Version: ${METAMASK_KIT_VERSION}`);
        console.log(`   Simple Factory: ${sepoliaTestnetEnvironment.SimpleFactory}`);
        console.log(`   Delegation Manager: ${sepoliaTestnetEnvironment.DelegationManager}`);
        console.log(`   EntryPoint: ${sepoliaTestnetEnvironment.EntryPoint}`);
        console.log(`   Caveat Enforcers: ${Object.keys(sepoliaTestnetEnvironment.caveatEnforcers).length} available`);
        console.log(`   Implementations: ${Object.keys(sepoliaTestnetEnvironment.implementations).length} available`);
        
    } catch (error) {
        console.error("❌ Failed to configure MetaMask environment for Sepolia testnet:", error);
        throw new Error(`MetaMask environment initialization failed: ${error}`);
    }
}

/**
 * Get the current Sepolia testnet environment configuration
 * 
 * @returns {SmartAccountsEnvironment} The environment configuration
 */
export function getSepoliaTestnetEnvironment(): SmartAccountsEnvironment {
    return { ...sepoliaTestnetEnvironment };
}

/**
 * Get all available caveat enforcer contracts
 * 
 * @returns {Record<string, string>} Object with enforcer names and addresses
 */
export function getCaveatEnforcers(): Record<string, string> {
    return { ...sepoliaTestnetEnvironment.caveatEnforcers };
}

/**
 * Get a specific caveat enforcer address by name
 * 
 * @param enforcerName - The name of the enforcer
 * @returns {string | undefined} The address of the enforcer or undefined if not found
 */
export function getEnforcerAddress(enforcerName: string): string | undefined {
    return sepoliaTestnetEnvironment.caveatEnforcers[enforcerName];
}

/**
 * Get all available implementation contracts
 * 
 * @returns {Record<string, string>} Object with implementation names and addresses
 */
export function getImplementations(): Record<string, string> {
    return { ...sepoliaTestnetEnvironment.implementations };
}

/**
 * Validate that all required contract addresses are properly formatted
 * 
 * @returns {boolean} True if all addresses are valid
 */
export function validateEnvironmentAddresses(): boolean {
    const addresses = [
        sepoliaTestnetEnvironment.SimpleFactory,
        sepoliaTestnetEnvironment.DelegationManager,
        sepoliaTestnetEnvironment.EntryPoint,
        sepoliaTestnetEnvironment.implementations.Hybrid,
        sepoliaTestnetEnvironment.implementations.MultiSig,
        sepoliaTestnetEnvironment.implementations.EIP7702Stateless,
        ...Object.values(sepoliaTestnetEnvironment.caveatEnforcers),
    ];

    for (const address of addresses) {
        if (!address || !address.startsWith('0x') || address.length !== 42) {
            console.error(`❌ Invalid contract address: ${address}`);
            return false;
        }
    }
    
    return true;
}

/**
 * Initialize with validation
 * 
 * This is the recommended function to use for initializing the environment
 * as it includes address validation before configuration.
 */
export function initializeWithValidation(): void {
    if (!validateEnvironmentAddresses()) {
        throw new Error("Invalid contract addresses in Sepolia testnet configuration");
    }
    
    initializeSepoliaEnvironment();
}

// Export the configuration for external use
export { sepoliaTestnetEnvironment as sepoliaEnvironment };

// Default export for convenience
export default {
    initializeSepoliaEnvironment,
    initializeWithValidation,
    getSepoliaTestnetEnvironment,
    getCaveatEnforcers,
    getEnforcerAddress,
    getImplementations,
    validateEnvironmentAddresses,
    SEPOLIA_TESTNET_CHAIN_ID,
    METAMASK_KIT_VERSION,
};
