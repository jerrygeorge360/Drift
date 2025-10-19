export function analyzePortfolio(portfolio: any, marketData?: any) {
    const allocations = portfolio.allocations || [];
    const recentRebalances = portfolio.rebalanceLogs?.slice(0, 3) || [];

    // Calculate total portfolio value in USD
    const totalValue = allocations.reduce((acc: number, a: { token: { id: string }; amount: number }) => {
        const price = marketData?.[a.token.id]?.usd ?? 1; // fallback to 1 if no market data
        const value = a.amount * price;
        return acc + value;
    }, 0);

// Calculate current weights vs target allocations
    const currentWeights = allocations.map((a: { token: { id: string; symbol: string }; amount: number; percent: number }) => {
        const price = marketData?.[a.token.id]?.usd ?? 1;
        const value = a.amount * price;
        const currentPercent = (value / totalValue) * 100;

        return {
            token: a.token.symbol,
            target: a.percent,       // target allocation from Prisma model
            current: currentPercent, // current allocation based on holdings
            deviation: currentPercent - a.percent
        };
    });


    const tolerance = 5;
    const needsAdjustment = currentWeights.some((w: { deviation: number; }) => Math.abs(w.deviation) > tolerance);

    return { currentWeights, totalValue, needsAdjustment, recentRebalances };
}
