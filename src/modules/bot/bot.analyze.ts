export function analyzePortfolio(portfolio: any, marketData?: any) {
    const allocations = portfolio.allocations || [];
    const recentRebalances = portfolio.rebalanceLogs?.slice(0, 3) || [];

    const totalValue = allocations.reduce((acc: number, a: any) => {
        const price = marketData?.[a.token.id]?.usd ?? 1;
        return acc + price * a.percent;
    }, 0);

    const currentWeights = allocations.map((a: any) => {
        const price = marketData?.[a.token.id]?.usd ?? 1;
        const currentPercent = (price * a.percent) / totalValue * 100;
        return {
            token: a.token.symbol,
            target: a.percent,
            current: currentPercent,
            deviation: currentPercent - a.percent,
        };
    });

    const tolerance = 5;
    const needsAdjustment = currentWeights.some((w: { deviation: number; }) => Math.abs(w.deviation) > tolerance);

    return { currentWeights, totalValue, needsAdjustment, recentRebalances };
}
