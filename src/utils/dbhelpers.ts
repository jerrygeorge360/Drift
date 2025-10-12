import prisma from "../config/db.js";
import {SmartAccount} from "viem/account-abstraction";

//
// USER
//

// Find or create user by walletAddress
export async function findOrCreateUser(walletAddress: string) {
    let user = await prisma.user.findUnique({
        where: { walletAddress },
    });
    if (!user) {
        user = await prisma.user.create({
            data: { walletAddress },
        });
    }
    return user;
}



export async function getUserById(userId: string) {
    return prisma.user.findUnique({
        where: { id: userId },
    });
}

// Delete user by ID
export async function deleteUserById(userId: string) {
    // Also consider cascading deletes if needed, or handle relations carefully
    return prisma.user.delete({
        where: { id: userId },
    });
}

// List all users
export async function getAllUsers() {
    return prisma.user.findMany();
}
// Update user last login timestamp
export async function updateUserLastLogin(userId: string) {
    return prisma.user.update({
        where: { id: userId },
        data: { lastLogin: new Date() },
    });
}

//
// SMART ACCOUNT
//

// Create new smart account for user + create portfolio automatically (one-to-one)
export async function createSmartAccountdb(userId: string, address: string, privateKey?: string, portfolioName = "Default Portfolio") {
    return prisma.smartAccount.create({
        data: {
            userId,
            address,
            privateKey, // encrypt before storing in production!
            portfolio: {
                create: {
                    name: portfolioName,
                },
            },
        },
        include: {
            portfolio: true,
        },
    });
}

// Get all smart accounts for a user (include portfolio)
export async function getUserSmartAccounts(userId: string) {
    return prisma.smartAccount.findMany({
        where: { userId },
        include: {
            portfolio: {
                include: {
                    allocations: true,
                    rebalanceLogs: true,
                },
            },
        },
    });
}

// Find smart account by address (include portfolio)
export async function findSmartAccountByAddress(address: string) {
    return prisma.smartAccount.findUnique({
        where: { address },
        include: {
            portfolio: {
                include: {
                    allocations: true,
                    rebalanceLogs: true,
                },
            },
        },
    });
}

export async function deleteSmartAccountById(id: string) {
    return prisma.smartAccount.delete({
        where: { id },
    });
}

export async function findSmartAccountById(id: string) {
    return prisma.smartAccount.findUnique({
        where: { id },
    });
}


//
// DELEGATION
//

export async function createDelegationdb(data: {
    smartAccountId: string;
    delegatorSmartAccount: SmartAccount;
    delegateSmartAccount: SmartAccount;
    scope: string[];
    signature:any;
    expiresAt?: Date;
}) {
    return prisma.delegation.create({
        data: {
            smartAccountId: data.smartAccountId,
            delegatorAddress: data.delegatorSmartAccount.address,
            delegateAddress: data.delegateSmartAccount.address,
            scope: data.scope,
            signature: data.signature,
            expiresAt: data.expiresAt,
        },
    });
}

export async function getDelegationsBySmartAccount(smartAccountId: string) {
    return prisma.delegation.findMany({
        where: { smartAccountId, revoked: false },
    });
}

export async function getDelegationById(id: string) {
    return prisma.delegation.findUnique({
        where: { id },
    });
}

export async function revokeDelegation(id: string) {
    return prisma.delegation.update({
        where: { id },
        data: { revoked: true },
    });
}

export async function isValidDelegation(delegateAddress: string, smartAccountId: string, requiredScope: string) {
    const delegations = await prisma.delegation.findMany({
        where: {
            delegateAddress,
            smartAccountId,
            revoked: false,
            expiresAt: {
                gt: new Date(),
            },
            scope: {
                has: requiredScope,
            },
        },
    });

    return delegations.length > 0;
}




//
// PORTFOLIO
//

// Get portfolio by smart account id (only one portfolio per smart account)
export async function getPortfolioBySmartAccountId(smartAccountId: string) {
    return prisma.portfolio.findUnique({
        where: { smartAccountId },
        include: {
            allocations: {
                include: {
                    token: true,
                },
            },
            rebalanceLogs: {
                orderBy: { createdAt: "desc" },
            },
        },
    });
}

// Update portfolio name by smartAccountId
export async function updatePortfolioName(smartAccountId: string, newName: string) {
    return prisma.portfolio.update({
        where: { smartAccountId },
        data: { name: newName },
    });
}

//
// PORTFOLIO ALLOCATION
//

// Set allocations for portfolio (replace old allocations)
export async function setPortfolioAllocations(
    portfolioId: string,
    allocations: { tokenId: string; percent: number }[]
) {
    // Delete existing allocations and recreate
    await prisma.portfolioAllocation.deleteMany({
        where: { portfolioId },
    });

    // Bulk create new allocations
    return prisma.portfolioAllocation.createMany({
        data: allocations.map(({ tokenId, percent }) => ({
            portfolioId,
            tokenId,
            percent,
        })),
    });
}

// Get allocations for a portfolio
export async function getPortfolioAllocations(portfolioId: string) {
    return prisma.portfolioAllocation.findMany({
        where: { portfolioId },
        include: { token: true },
    });
}

// Delete a single token allocation from a portfolio
export async function deletePortfolioAllocation(portfolioId: any, tokenId: any) {
    return prisma.portfolioAllocation.deleteMany({
        where: {
            portfolioId,
            tokenId,
        },
    });
}

// Delete all allocations for a portfolio
export async function deleteAllPortfolioAllocations(portfolioId: any) {
    return prisma.portfolioAllocation.deleteMany({
        where: { portfolioId },
    });
}



//
// REBALANCE LOG
//

// Log a rebalance event
export async function createRebalanceLog(data: {
    portfolioId: string;
    tokenInId: string;
    tokenOutId: string;
    amountIn: number;
    amountOut: number;
    reason: string;
    executor: string;
}) {
    return prisma.rebalanceLog.create({
        data: {
            ...data,
        },
    });
}

// Get rebalance logs for a portfolio
export async function getRebalanceLogs(portfolioId: string, limit = 50) {
    return prisma.rebalanceLog.findMany({
        where: { portfolioId },
        orderBy: { createdAt: "desc" },
        take: limit,
        include: {
            tokenIn: true,
            tokenOut: true,
        },
    });
}

//
// TOKEN
//

// Find token by symbol or address
export async function findTokenBySymbol(symbol: string) {
    return prisma.token.findUnique({ where: { symbol } });
}

export async function findTokenByAddress(address: string) {
    return prisma.token.findUnique({ where: { address } });
}

// Create a new token (if needed)
export async function createToken(data: {
    symbol: string;
    name: string;
    address: string;
    decimals: number;
}) {
    return prisma.token.create({ data });
}

export const getAllTokens = async () => {
    return prisma.token.findMany({
        orderBy: { createdAt: 'desc' },
    });
};

export const deleteToken = async (id: any) => {
    return prisma.token.delete({ where: { id } });
};

//
// CONTRACT CONFIG
//

export async function getContractConfigByAddress(address: string) {
    return prisma.contractConfig.findUnique({ where: { contractAddress: address } });
}

export async function createOrUpdateContractConfig(data: {
    contractAddress: string;
    network: string;
    owner: string;
    paused?: boolean;
}) {
    return prisma.contractConfig.upsert({
        where: { contractAddress: data.contractAddress },
        update: {
            network: data.network,
            owner: data.owner,
            paused: data.paused,
            updatedAt: new Date(),
        },
        create: {
            contractAddress: data.contractAddress,
            network: data.network,
            owner: data.owner,
            paused: data.paused ?? false,
        },
    });
}
