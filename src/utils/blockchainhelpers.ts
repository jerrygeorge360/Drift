import { walletActions } from "viem";
import { publicClient } from "../controllers/clients.js";
import smartPortfolio from "../contracts/abi/SmartPortfolio.json" with { type: 'json' };

const SMART_PORTFOLIO_ABI = smartPortfolio.abi;

// ========================================
// WRITE FUNCTIONS (State Changing)
// ========================================

/**
 * Write pause (owner only)
 */
export const writePause = async(
    contractAddress: `0x${string}`,
    walletClient:any
)=> await walletClient.writeContract({
    address: contractAddress,
    abi: SMART_PORTFOLIO_ABI,
    functionName: "pause",
})

/**
 * Unpause the contract (owner only)
 */
export const writeUnpause = async(
    contractAddress: `0x${string}`,
    walletClient: any
)=> await walletClient.writeContract({
    address: contractAddress,
    abi: SMART_PORTFOLIO_ABI,
    functionName: "unpause",
})

export const writeSetAllocation = async(
    contractAddress: `0x${string}`,
    walletClient: any,
    tokens: `0x${string}`[],
    percents: number[]
)=> await walletClient.writeContract({
    address: contractAddress,
    abi: SMART_PORTFOLIO_ABI,
    functionName: "setAllocation",
    args: [tokens, percents]
})

export const writeRemoveAllocation = async(
    contractAddress: `0x${string}`,
    walletClient: any
)=> await walletClient.writeContract({
    address: contractAddress,
    abi: SMART_PORTFOLIO_ABI,
    functionName: "removeAllocation",   
})

export const writeRevokeApproval = async(
    contractAddress: `0x${string}`,
    walletClient: any,
    token: `0x${string}`
)=> await walletClient.writeContract({
    address: contractAddress,
    abi: SMART_PORTFOLIO_ABI,
    functionName: "revokeApproval",
    args: [token]
})

// owner only
export const writeTransferOwnership = async(
    contractAddress: `0x${string}`,
    walletClient: any,
    newOwner: `0x${string}`
)=> await walletClient.writeContract({
    address: contractAddress,
    abi: SMART_PORTFOLIO_ABI,
    functionName: "transferOwnership",
    args: [newOwner]
})

// ========================================
// READ FUNCTIONS (View/Pure)
// ========================================

export type TokenAllocation = {
    token: `0x${string}`;
    percent: number;
};

/**
 * Get user's portfolio allocation
 */
export const getAllocation = async (
    contractAddress: `0x${string}`,
    smartAccountAddress: `0x${string}`
): Promise<TokenAllocation[]> => {
    const result = await publicClient.readContract({
        address: contractAddress,
        abi: SMART_PORTFOLIO_ABI,
        functionName: "getAllocation",
        args: [smartAccountAddress]
    });

    return result as TokenAllocation[];
};

/**
 * Check if user has a valid allocation
 */
export const hasAllocation = async (
    contractAddress: `0x${string}`,
    smartAccountAddress: `0x${string}`
): Promise<boolean> => {
    const result = await publicClient.readContract({
        address: contractAddress,
        abi: SMART_PORTFOLIO_ABI,
        functionName: "hasAllocation",
        args: [smartAccountAddress]
    });

    return result as boolean;
};

/**
 * Get estimated output amount for a swap
 */
export const getEstimatedOut = async (
    contractAddress: `0x${string}`,
    amountIn: bigint,
    path: `0x${string}`[]
): Promise<bigint[]> => {
    const result = await publicClient.readContract({
        address: contractAddress,
        abi: SMART_PORTFOLIO_ABI,
        functionName: "getEstimatedOut",
        args: [amountIn, path]
    });

    return result as bigint[];
};





/**
 * Check if contract is paused
 */
export const isPaused = async (contractAddress: `0x${string}`): Promise<boolean> => {
    const result = await publicClient.readContract({
        address: contractAddress,
        abi: SMART_PORTFOLIO_ABI,
        functionName: "paused",
        args: []
    });

    return result as boolean;
};

/**
 * Get router address
 */
export const getRouter = async (contractAddress: `0x${string}`): Promise<`0x${string}`> => {
    const result = await publicClient.readContract({
        address: contractAddress,
        abi: SMART_PORTFOLIO_ABI,
        functionName: "router",
        args: []
    });

    return result as `0x${string}`;
};

/**
 * Get contract owner
 */
export const getOwner = async (contractAddress: `0x${string}`): Promise<`0x${string}`> => {
    const result = await publicClient.readContract({
        address: contractAddress,
        abi: SMART_PORTFOLIO_ABI,
        functionName: "owner",
        args: []
    });

    return result as `0x${string}`;
};
