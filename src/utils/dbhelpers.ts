import prisma from "../config/db.js";
import { SmartAccount } from "viem/account-abstraction";
import { decryptPrivateKey, encryptPrivateKey } from "./encryption.js";
import { logger } from "./logger.js";
import type { Bot as BotModel } from "@prisma/client";

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
export async function createSmartAccountdb(userId: string, address: string, privateKey: string, portfolioName = "Default Portfolio", ownerAddress: string) {
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
            ownerAddress: ownerAddress,
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

// Update smart account deployment status
export async function updateSmartAccountDeploymentStatus(
    id: string,
    deploymentTxHash: string
) {
    return prisma.smartAccount.update({
        where: { id },
        data: {
            deployed: true,
            deployedAt: new Date(),
            deploymentTxHash,
        },
    });
}


//
// DELEGATION
//

export async function createDelegationdb(data: {
    smartAccountId: string;
    delegatorSmartAccount: SmartAccount;
    delegateSmartAccount: SmartAccount;
    signature: any;
    expiresAt?: Date;
}) {
    return prisma.delegation.create({
        data: {
            smartAccountId: data.smartAccountId,
            delegatorAddress: data.delegatorSmartAccount.address,
            delegateAddress: data.delegateSmartAccount.address,
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
export async function getDelegationBySmartAccountId(
    smartAccountId: string
) {
    return prisma.delegation.findUnique({
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

// create portfolio(initialization)
export async function createPortfolio(smartAccountId: string, name: string, portfolioAddress?: string) {
    const portfolioData: any = {
        smartAccountId,
        name,
    };

    // Add portfolioAddress if provided (after schema migration)
    if (portfolioAddress) {
        portfolioData.portfolioAddress = portfolioAddress;
    }

    return prisma.portfolio.create({
        data: portfolioData,
    });
}

// Update portfolio with on-chain address
export async function updatePortfolioAddress(smartAccountId: string, portfolioAddress: string) {
    return prisma.portfolio.update({
        where: { smartAccountId },
        data: { portfolioAddress } as any, // Temporary type assertion until migration
    });
}

// Get portfolio address by smart account ID
export async function getPortfolioAddressBySmartAccountId(smartAccountId: string): Promise<string | null> {
    try {
        const portfolio = await prisma.portfolio.findUnique({
            where: { smartAccountId },
            select: {
                portfolioAddress: true,
            },
        });

        if (!portfolio) {
            logger.warn("Portfolio not found for smartAccountId", smartAccountId);
            return null;
        }

        return portfolio.portfolioAddress ?? null;
    } catch (error) {
        logger.error("Error getting portfolio address", error);
        return null;
    }
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



// Log a rebalance event
export async function createRebalanceLog(
    data:
        | {
            portfolioId: string;
            tokenInId: string;
            tokenOutId: string;
            amountIn: number;
            amountOut: number;
            reason: string;
            executor: string;
            userOpHash?: string;
            transactionHash?: string;
            blockNumber?: string;
            status?: string;
            gasUsed?: string;
        }
        | {
            portfolioId: string;
            tokenInId: string;
            tokenOutId: string;
            amountIn: number;
            amountOut: number;
            reason: string;
            executor: string;
            userOpHash?: string;
            transactionHash?: string;
            blockNumber?: string;
            status?: string;
            gasUsed?: string;
        }[]
) {
    if (Array.isArray(data)) {
        // 🧩 Bulk insert (createMany only accepts scalar fields — no nested connect)
        return prisma.rebalanceLog.createMany({
            data: data.map((d) => ({
                portfolioId: d.portfolioId,
                tokenInId: d.tokenInId,
                tokenOutId: d.tokenOutId,
                amountIn: d.amountIn,
                amountOut: d.amountOut,
                reason: d.reason,
                executor: d.executor,
                userOpHash: d.userOpHash,
                transactionHash: d.transactionHash,
                blockNumber: d.blockNumber,
                status: d.status,
                gasUsed: d.gasUsed,
            })),
            skipDuplicates: true,
        });
    }

    // 🧩 Single insert
    return prisma.rebalanceLog.create({
        data: {
            portfolioId: data.portfolioId,
            tokenInId: data.tokenInId,
            tokenOutId: data.tokenOutId,
            amountIn: data.amountIn,
            amountOut: data.amountOut,
            reason: data.reason,
            executor: data.executor,
            userOpHash: data.userOpHash,
            transactionHash: data.transactionHash,
            blockNumber: data.blockNumber,
            status: data.status,
            gasUsed: data.gasUsed,
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

export async function getContractConfigByName(name: string) {
    return prisma.contractConfig.findUnique({ where: { name } });
}
export async function getContractAddressByName(name: string): Promise<`0x${string}` | null> {
    const config = await prisma.contractConfig.findUnique({
        where: { name },
        select: { contractAddress: true },
    });
    return (config?.contractAddress as `0x${string}`) ?? null;
}

export async function createOrUpdateContractConfig(data: {
    name: string;
    contractAddress: string;
    network?: string;
    owner: string;
    paused?: boolean;
}) {
    return prisma.contractConfig.upsert({
        where: { contractAddress: data.contractAddress },
        update: {
            name: data.name,
            network: data.network,
            owner: data.owner,
            paused: data.paused,
            updatedAt: new Date(),
        },
        create: {
            name: data.name,
            contractAddress: data.contractAddress,
            network: data.network ?? "monadTestnet",
            owner: data.owner,
            paused: data.paused ?? false,
        },
    });
}

export async function getAllContractConfigs(network?: string) {
    return prisma.contractConfig.findMany({
        where: network ? { network } : undefined,
        orderBy: { updatedAt: "desc" },
    });
}
export async function updateContractPauseStatus(name: string, paused: boolean) {
    return prisma.contractConfig.update({
        where: { name },
        data: { paused },
    });
}
export async function deleteContractConfig(contractAddress: string) {
    return prisma.contractConfig.delete({
        where: { contractAddress },
    });
}

export async function deleteContractConfigByName(name: string) {
    return prisma.contractConfig.delete({
        where: { name },
    });
}

//
// BOT
//

export async function createBot(data: {
    name: string;
    description?: string;
    address: string;
    privateKey: string;
    role?: string;
    status?: string;
}) {
    const encryptedKey = encryptPrivateKey(data.privateKey);

    return prisma.bot.create({
        data: {
            name: data.name,
            description: data.description,
            address: data.address, // ✅ required
            encryptedKey,
            role: data.role || "bot",
            status: data.status || "active",
        },
    });
}


// Get all bots
export async function getAllBots() {
    return prisma.bot.findMany({
        orderBy: { createdAt: "desc" },
    });
}

// Get bot by ID (decrypted private key optional)
export async function getBotById(botId: string, withPrivateKey = false) {
    const bot = await prisma.bot.findUnique({ where: { id: botId } });
    if (!bot) return null;

    if (withPrivateKey && bot.encryptedKey) {
        const decrypted = decryptPrivateKey(bot.encryptedKey);
        return { ...bot, privateKey: decrypted };
    }

    return bot;
}

//  Update bot info (optional private key update)
export async function updateBot(botName: string, data: Partial<{ name: string; description: string; privateKey: string; status: string; }>) {
    const updateData: any = { ...data };
    if (data.privateKey) {
        updateData.encryptedKey = encryptPrivateKey(data.privateKey);
        delete updateData.privateKey;
    }

    return prisma.bot.update({
        where: { name: botName },
        data: updateData,
    });
}

export async function getBotByName(
    name: string,
    withPrivateKey = false
): Promise<(BotModel & { privateKey?: `0x${string}` }) | null> {
    // Find the bot by name
    const bot = await prisma.bot.findUnique({ where: { name } });
    if (!bot) return null;

    // If requested, decrypt the private key
    if (withPrivateKey && bot.encryptedKey) {
        const decrypted: `0x${string}` = decryptPrivateKey(bot.encryptedKey);
        return { ...bot, privateKey: decrypted };
    }

    return bot;
}


// Delete bot
export async function deleteBot(botId: string) {
    return prisma.bot.delete({ where: { id: botId } });
}