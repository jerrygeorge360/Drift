import { RebalancePortfolio, PortfolioWithAllocations } from "./rebalancer.types.js";



/**
 * Maps a Prisma portfolio with its allocations to a RebalancePortfolio object.
 * 
 * @param prismaPortfolio - The portfolio data from Prisma including nested allocations and token details.
 * @returns A RebalancePortfolio object formatted for the rebalancing logic, converting percentages to decimals.
 */
export function mapPortfolio(
    portfolio: PortfolioWithAllocations
): RebalancePortfolio {
    return {
        portfolioId: portfolio.id,
        smartAccountId: portfolio.smartAccountId,
        tokens: portfolio.allocations.map(a => ({
            symbol: a.token.symbol,
            address: a.token.address,
            decimals: a.token.decimals,
            balance: a.amount,
            targetPercent: a.percent / 100,
        })),
    };
}