import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Simple in-memory cache with TTL
class SimpleCache {
  private cache = new Map<string, { data: any; expires: number }>();

  set(key: string, data: any, ttlMs: number = 30000) {
    this.cache.set(key, {
      data,
      expires: Date.now() + ttlMs
    });
  }

  get(key: string): any | null {
    const item = this.cache.get(key);
    if (!item || Date.now() > item.expires) {
      this.cache.delete(key);
      return null;
    }
    return item.data;
  }

  clear() {
    this.cache.clear();
  }
}

export interface DashboardData {
  totalAssetValue: number;
  portfolioPerformance: {
    timeframe: string;
    value: number;
    timestamp: Date;
  }[];
  tokenBreakdown: {
    symbol: string;
    amount: number;
    usdValue: number;
    percentage: number;
    drift: number;
    targetPercentage: number;
  }[];
  driftAnalysis: {
    totalDrift: number;
    significantDrifts: {
      tokenSymbol: string;
      currentDrift: number;
      threshold: number;
    }[];
  };
  recentRebalances: {
    id: string;
    tokenIn: string;
    tokenOut: string;
    amountIn: number;
    amountOut: number;
    driftPercentage: number;
    createdAt: Date;
  }[];
}

export class DashboardService {
  private cache = new SimpleCache();
  async getPortfolioDashboardData(portfolioId: string): Promise<DashboardData> {
    // Check cache first
    const cacheKey = `dashboard:${portfolioId}`;
    const cached = this.cache.get(cacheKey);
    if (cached) {
      return cached;
    }

    // Use connection timeout and query optimization
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Database timeout')), 8000)
    );

    try {
      const result = await Promise.race([
        this.fetchDashboardData(portfolioId),
        timeoutPromise
      ]) as DashboardData;

      // Cache the result for 25 seconds (less than update interval)
      this.cache.set(cacheKey, result, 25000);
      
      return result;
    } catch (error) {
      console.error('Dashboard data fetch error:', error);
      throw error;
    }
  }

  private async fetchDashboardData(portfolioId: string): Promise<DashboardData> {
    // Optimize queries with select fields and indexes
    const [currentAllocations, recentRebalances, tokenPrices] = await Promise.all([
      this.getCurrentAllocations(portfolioId),
      this.getRecentRebalances(portfolioId),
      this.getCachedTokenPrices()
    ]);

    const totalAssetValue = this.calculateTotalAssetValue(currentAllocations, tokenPrices);
    const tokenBreakdown = this.calculateTokenBreakdown(currentAllocations, tokenPrices, totalAssetValue);
    const driftAnalysis = this.calculateDriftAnalysis(tokenBreakdown);
    const portfolioPerformance = this.calculatePerformanceFromRebalances(recentRebalances, tokenPrices);

    return {
      totalAssetValue,
      portfolioPerformance,
      tokenBreakdown,
      driftAnalysis,
      recentRebalances: recentRebalances.map(rebalance => ({
        id: rebalance.id,
        tokenIn: rebalance.tokenIn.symbol,
        tokenOut: rebalance.tokenOut.symbol,
        amountIn: rebalance.amountIn,
        amountOut: rebalance.amountOut,
        driftPercentage: rebalance.driftPercentage || 0,
        createdAt: rebalance.createdAt
      }))
    };
  }

  private async getPortfolio(portfolioId: string) {
    return prisma.portfolio.findUnique({
      where: { id: portfolioId },
      include: {
        allocations: {
          include: { token: true }
        }
      }
    });
  }

  private async getCurrentAllocations(portfolioId: string) {
    return prisma.portfolioAllocation.findMany({
      where: { portfolioId },
      include: { token: true }
    });
  }

  private async getRecentRebalances(portfolioId: string) {
    return prisma.rebalanceLog.findMany({
      where: { portfolioId },
      include: {
        tokenIn: true,
        tokenOut: true
      },
      orderBy: { createdAt: 'desc' },
      take: 10 // Limit for performance
    });
  }

  private async getCachedTokenPrices() {
    const cacheKey = 'token-prices';
    let prices = this.cache.get(cacheKey);
    
    if (!prices) {
      prices = await prisma.tokenPrice.findMany({
        orderBy: { lastUpdatedAt: 'desc' },
        distinct: ['symbol']
      });

      // Cache token prices for 60 seconds
      this.cache.set(cacheKey, prices, 60000);
    }

    return prices.reduce((acc: any, price: any) => {
      acc[price.symbol] = {
        usdPrice: price.usdPrice,
        usd24hChange: price.usd24hChange || 0
      };
      return acc;
    }, {} as Record<string, { usdPrice: number; usd24hChange: number }>);
  }

  private async getLatestTokenPrices() {
    // Fallback method for backward compatibility
    return this.getCachedTokenPrices();
  }

  private calculateTotalAssetValue(allocations: any[], prices: any): number {
    return allocations.reduce((total, allocation) => {
      const price = prices[allocation.token.symbol]?.usdPrice || 0;
      return total + (allocation.amount * price);
    }, 0);
  }

  private calculateTokenBreakdown(allocations: any[], prices: any, totalValue: number) {
    return allocations.map(allocation => {
      const price = prices[allocation.token.symbol]?.usdPrice || 0;
      const usdValue = allocation.amount * price;
      const currentPercentage = totalValue > 0 ? (usdValue / totalValue) * 100 : 0;
      const drift = currentPercentage - allocation.percent;

      return {
        symbol: allocation.token.symbol,
        amount: allocation.amount,
        usdValue,
        percentage: currentPercentage,
        targetPercentage: allocation.percent,
        drift
      };
    });
  }

  private calculateDriftAnalysis(tokenBreakdown: any[]) {
    const totalDrift = tokenBreakdown.reduce((sum, token) => sum + Math.abs(token.drift), 0);
    const significantDrifts = tokenBreakdown
      .filter(token => Math.abs(token.drift) > 5) // 5% drift threshold
      .map(token => ({
        tokenSymbol: token.symbol,
        currentDrift: token.drift,
        threshold: 5
      }));

    return {
      totalDrift,
      significantDrifts
    };
  }

  private calculatePerformanceFromRebalances(rebalances: any[], prices: any) {
    // Use rebalance timestamps to create a time series
    const timePoints = rebalances
      .slice(0, 30) // Last 30 rebalances
      .reverse()
      .map((rebalance, index) => ({
        timeframe: `${index}h`,
        value: this.estimatePortfolioValueAtRebalance(rebalance, prices),
        timestamp: rebalance.createdAt
      }));

    return timePoints;
  }

  private estimatePortfolioValueAtRebalance(rebalance: any, currentPrices: any): number {
    // Simple estimation based on rebalance amounts and current prices
    const inValue = rebalance.amountIn * (currentPrices[rebalance.tokenIn.symbol]?.usdPrice || 0);
    const outValue = rebalance.amountOut * (currentPrices[rebalance.tokenOut.symbol]?.usdPrice || 0);
    return Math.max(inValue, outValue) * 10; // Rough estimation multiplier
  }

  // Helper method to get all portfolios for a user
  async getUserPortfolios(userId: string) {
    return prisma.portfolio.findMany({
      where: {
        smartAccount: {
          userId
        }
      },
      include: {
        smartAccount: true,
        allocations: {
          include: { token: true }
        }
      }
    });
  }
}
