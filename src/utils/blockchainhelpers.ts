import { publicClient } from "../controllers/clients.js";
import { logger } from "./logger.js";
import smartPortfolio from "../contracts/abi/UserPortfolio.json" with { type: 'json' };

const SMART_PORTFOLIO_ABI = smartPortfolio.abi;

// ========================================
// WRITE FUNCTIONS (State Changing)
// ========================================

// Write pause (owner only)
export const writePause = async (
    contractAddress: `0x${string}`,
    walletClient: any
) => await walletClient.writeContract({
    address: contractAddress,
    abi: SMART_PORTFOLIO_ABI,
    functionName: "pause",
})

// Unpause the contract (owner only)
export const writeUnpause = async (
    contractAddress: `0x${string}`,
    walletClient: any
) => await walletClient.writeContract({
    address: contractAddress,
    abi: SMART_PORTFOLIO_ABI,
    functionName: "unpause",
})

// Set allocation (owner only)
export const writeSetAllocation = async (
    contractAddress: `0x${string}`,
    walletClient: any,
    tokens: `0x${string}`[],
    percents: number[]
) => await walletClient.writeContract({
    address: contractAddress,
    abi: SMART_PORTFOLIO_ABI,
    functionName: "setAllocation",
    args: [tokens, percents]
})

// Remove allocation (owner only)
export const writeRemoveAllocation = async (
    contractAddress: `0x${string}`,
    walletClient: any
) => await walletClient.writeContract({
    address: contractAddress,
    abi: SMART_PORTFOLIO_ABI,
    functionName: "removeAllocation",
})

// Revoke approval (owner only)
export const writeRevokeApproval = async (
    contractAddress: `0x${string}`,
    walletClient: any,
    token: `0x${string}`
) => await walletClient.writeContract({
    address: contractAddress,
    abi: SMART_PORTFOLIO_ABI,
    functionName: "revokeApproval",
    args: [token]
})

// Transfer ownership (owner only)
export const writeTransferOwnership = async (
    contractAddress: `0x${string}`,
    walletClient: any,
    newOwner: `0x${string}`
) => await walletClient.writeContract({
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

// Get user's portfolio allocation
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

// Check if user has a valid allocation
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

// Get estimated output amount for a swap
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





// Check if contract is paused
export const isPaused = async (contractAddress: `0x${string}`): Promise<boolean> => {
    const result = await publicClient.readContract({
        address: contractAddress,
        abi: SMART_PORTFOLIO_ABI,
        functionName: "paused",
        args: []
    });

    return result as boolean;
};

// Get router address
export const getRouter = async (contractAddress: `0x${string}`): Promise<`0x${string}`> => {
    const result = await publicClient.readContract({
        address: contractAddress,
        abi: SMART_PORTFOLIO_ABI,
        functionName: "router",
        args: []
    });

    return result as `0x${string}`;
};

// Get contract owner
export const getOwner = async (contractAddress: `0x${string}`): Promise<`0x${string}`> => {
    const result = await publicClient.readContract({
        address: contractAddress,
        abi: SMART_PORTFOLIO_ABI,
        functionName: "owner",
        args: []
    });

    return result as `0x${string}`;
};
// Get token balance for an address
export const getTokenBalance = async (
    tokenAddress: `0x${string}`,
    ownerAddress: `0x${string}`
): Promise<bigint> => {
    return await publicClient.readContract({
        address: tokenAddress,
        abi: [
            {
                name: "balanceOf",
                type: "function",
                stateMutability: "view",
                inputs: [{ name: "account", type: "address" }],
                outputs: [{ type: "uint256" }],
            },
        ],
        functionName: "balanceOf",
        args: [ownerAddress],
    }) as bigint;
};

/**
 * Syncs the database 'amount' field with real on-chain balances for a portfolio.
 */
export const syncPortfolioBalances = async (
    smartAccountAddress: string,
    portfolioId: string,
    allocations: any[]
) => {
    logger.info(`Syncing balances for Smart Account: ${smartAccountAddress}`);

    const updates = allocations.map(async (alloc) => {
        try {
            const balance = await getTokenBalance(
                alloc.token.address as `0x${string}`,
                smartAccountAddress as `0x${string}`
            );

            // Convert from wei to human-readable float based on decimals
            const humanReadableBalance = Number(balance) / Math.pow(10, alloc.token.decimals);

            return {
                id: alloc.id,
                amount: humanReadableBalance
            };
        } catch (error) {
            logger.error(`Failed to fetch balance for ${alloc.token.symbol}:`, error);
            return null;
        }
    });

    const results = await Promise.all(updates);

    // Update database in bulk (or sequentially if needed)
    for (const res of results) {
        if (res) {
            await import("../config/db.js").then(async (m) => {
                await m.default.portfolioAllocation.update({
                    where: { id: res.id },
                    data: { amount: res.amount }
                });
            });
        }
    }

    logger.info(`Finished syncing balances for ${smartAccountAddress}`);
};

/**
 * Gets the "Spot Price" from the Uniswap pool.
 * Returns how much 'baseToken' you get for 1 unit of 'token'.
 */
export const getSpotPriceFromRouter = async (
    smartPortfolioAddress: `0x${string}`,
    tokenAddress: `0x${string}`,
    tokenDecimals: number,
    baseTokenAddress: `0x${string}`,
    baseTokenDecimals: number
): Promise<number> => {
    try {
        // We ask for the price of 1 full token
        const amountIn = BigInt(Math.pow(10, tokenDecimals));
        const path = [tokenAddress, baseTokenAddress] as `0x${string}`[];

        const amounts = await getEstimatedOut(smartPortfolioAddress, amountIn, path);
        const amountOut = amounts[amounts.length - 1];

        // Convert back to a human-readable number
        return Number(amountOut) / Math.pow(10, baseTokenDecimals);
    } catch (error) {
        logger.warn(`Could not fetch spot price for ${tokenAddress} via router:`, error);
        return 0;
    }
};

