import { encodeFunctionData, parseUnits, formatUnits } from "viem";
import { publicClient } from "../controllers/clients.js";
import smartPortfolio from "../contracts/abi/SmartPortfolio.json" with { type: 'json' };

const SMART_PORTFOLIO_ABI = smartPortfolio.abi;

// ========================================
// WRITE FUNCTIONS (State Changing)
// ========================================

/**
 * Set user's portfolio allocation
 * @param tokens - Array of token addresses
 * @param percents - Array of percentages (must sum to 100)
 */
export const encodeSetAllocation = (
    tokens: `0x${string}`[],
    percents: number[]
): `0x${string}` => {
    return encodeFunctionData({
        abi: SMART_PORTFOLIO_ABI,
        functionName: "setAllocation",
        args: [tokens, percents]
    });
};

/**
 * Remove user's allocation
 */
export const encodeRemoveAllocation = (): `0x${string}` => {
    return encodeFunctionData({
        abi: SMART_PORTFOLIO_ABI,
        functionName: "removeAllocation",
        args: []
    });
};

/**
 * Revoke token approval for router
 */
export const encodeRevokeApproval = (token: `0x${string}`): `0x${string}` => {
    return encodeFunctionData({
        abi: SMART_PORTFOLIO_ABI,
        functionName: "revokeApproval",
        args: [token]
    });
};

/**
 * Pause the contract (owner only)
 */
export const encodePause = (): `0x${string}` => {
    return encodeFunctionData({
        abi: SMART_PORTFOLIO_ABI,
        functionName: "pause",
        args: []
    });
};

/**
 * Unpause the contract (owner only)
 */
export const encodeUnpause = (): `0x${string}` => {
    return encodeFunctionData({
        abi: SMART_PORTFOLIO_ABI,
        functionName: "unpause",
        args: []
    });
};

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
    userAddress: `0x${string}`
): Promise<TokenAllocation[]> => {
    const result = await publicClient.readContract({
        address: contractAddress,
        abi: SMART_PORTFOLIO_ABI,
        functionName: "getAllocation",
        args: [userAddress]
    });

    return result as TokenAllocation[];
};

/**
 * Check if user has a valid allocation
 */
export const hasAllocation = async (
    contractAddress: `0x${string}`,
    userAddress: `0x${string}`
): Promise<boolean> => {
    const result = await publicClient.readContract({
        address: contractAddress,
        abi: SMART_PORTFOLIO_ABI,
        functionName: "hasAllocation",
        args: [userAddress]
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
 * Get contract balance for a specific token
 */
export const getContractBalance = async (
    contractAddress: `0x${string}`,
    tokenAddress: `0x${string}`
): Promise<bigint> => {
    const result = await publicClient.readContract({
        address: contractAddress,
        abi: SMART_PORTFOLIO_ABI,
        functionName: "getContractBalance",
        args: [tokenAddress]
    });

    return result as bigint;
};

/**
 * Validate a rebalance before execution
 */
export const validateRebalance = async (
    contractAddress: `0x${string}`,
    tokenIn: `0x${string}`,
    tokenOut: `0x${string}`,
    amountIn: bigint,
    amountOutMin: bigint,
    path: `0x${string}`[]
): Promise<{ valid: boolean; reason: string }> => {
    const result = await publicClient.readContract({
        address: contractAddress,
        abi: SMART_PORTFOLIO_ABI,
        functionName: "validateRebalance",
        args: [tokenIn, tokenOut, amountIn, amountOutMin, path]
    });

    const [valid, reason] = result as [boolean, string];
    return { valid, reason };
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

// ========================================
// UTILITY FUNCTIONS
// ========================================

/**
 * Calculate slippage tolerance
 * @param amount - Original amount
 * @param slippagePercent - Slippage percentage (e.g., 1 for 1%)
 */
export const calculateMinAmount = (amount: bigint, slippagePercent: number): bigint => {
    const slippage = BigInt(Math.floor(slippagePercent * 100));
    return (amount * (10000n - slippage)) / 10000n;
};


/**
 * Validate allocation percentages
 */
export const validateAllocationPercents = (percents: number[]): {
    valid: boolean;
    reason: string;
} => {
    if (percents.length === 0) {
        return { valid: false, reason: "No percentages provided" };
    }

    const sum = percents.reduce((acc, p) => acc + p, 0);
    if (sum !== 100) {
        return { valid: false, reason: `Sum must equal 100, got ${sum}` };
    }

    if (percents.some(p => p <= 0)) {
        return { valid: false, reason: "All percentages must be greater than 0" };
    }

    return { valid: true, reason: "Valid" };
};

/**
 * Format token amount with decimals
 */
export const formatTokenAmount = (
    amount: bigint,
    decimals: number = 18
): string => {
    return formatUnits(amount, decimals);
};

/**
 * Parse token amount to BigInt
 */
export const parseTokenAmount = (
    amount: string,
    decimals: number = 18
): bigint => {
    return parseUnits(amount, decimals);
};

// ========================================
// EVENT PARSING
// ========================================

export type RebalanceExecutedEvent = {
    user: `0x${string}`;
    executor: `0x${string}`;
    tokenIn: `0x${string}`;
    tokenOut: `0x${string}`;
    amountIn: bigint;
    amountOut: bigint;
    reason: string;
    timestamp: bigint;
};

export type DynamicAllocationSetEvent = {
    user: `0x${string}`;
    tokens: `0x${string}`[];
    percents: number[];
};

// ========================================
// BATCH OPERATIONS
// ========================================

/**
 * Get multiple users' allocations in one call
 */
export const getBatchAllocations = async (
    contractAddress: `0x${string}`,
    userAddresses: `0x${string}`[]
): Promise<Map<`0x${string}`, TokenAllocation[]>> => {
    const allocations = new Map<`0x${string}`, TokenAllocation[]>();

    const promises = userAddresses.map(user =>
        getAllocation(contractAddress, user)
    );

    const results = await Promise.all(promises);

    userAddresses.forEach((user, index) => {
        allocations.set(user, results[index]);
    });

    return allocations;
};