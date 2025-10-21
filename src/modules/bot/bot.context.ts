import { MarketData } from "./bot.agent.js";

interface CurrentWeight {
    token: string;
    target: number;
    current: number;
    deviation: number;
}

interface RecentRebalance {
    tokenInId: string;
    tokenOutId: string;
    reason: string;
    timestamp?: string;
}

interface Portfolio {
    name: string;
    allocations: any[];
    rebalanceLogs?: any[];
    // Add other portfolio fields as needed
}

/**
 * Builds LLM context for AI agent decision making
 * @param portfolio - Portfolio object with allocations
 * @param marketData - Current market prices and data
 * @param currentWeights - Calculated current vs target weights
 * @param recentRebalances - Recent rebalancing history
 * @param totalValue
 * @param agentMode - Operating mode for the agent
 */
export function buildLLMContext(
    portfolio: Portfolio,
    marketData?: MarketData,
    currentWeights?: CurrentWeight[],
    recentRebalances?: RecentRebalance[],
    totalValue?: number,
    agentMode: string = "auto"
): string {
    const weights = currentWeights || [];
    const rebalances = recentRebalances || [];
    const total = totalValue ? `$${totalValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}` : "Unknown";

    return `
Portfolio: ${portfolio.name || "Unnamed Portfolio"}
Total Value: ${total}

Allocations (Target vs Current):
${weights.length > 0
        ? weights
            .map(
                (w) =>
                    `- ${w.token}: Target ${w.target.toFixed(2)}%, Current ${w.current.toFixed(
                        2
                    )}%, Deviation ${w.deviation.toFixed(2)}%`
            )
            .join("\n")
        : "No allocations configured"
    }

Recent Rebalances:
${
        rebalances.length > 0
            ? rebalances
                .map((r) =>
                    `• In: ${r.tokenInId}, Out: ${r.tokenOutId}, Reason: ${r.reason}${
                        r.timestamp ? ` (${new Date(r.timestamp).toLocaleDateString()})` : ""
                    }`
                )
                .join("\n")
            : "None yet."
    }

Market Summary:
${
        marketData && Object.keys(marketData).length > 0
            ? Object.entries(marketData)
                .map(([id, data]) => `• ${id.toUpperCase()}: $${data.usd.toFixed(2)}`)
                .join("\n")
            : "No market data provided"
    }

Volatility (24h Change):
${
        marketData && Object.keys(marketData).length > 0
            ? Object.entries(marketData)
                .map(([id, data]) => `• ${id.toUpperCase()}: ${data.usd_24h_change.toFixed(2)}%`)
                .join("\n")
            : "No volatility data provided"
    }

Market Cap & Volume:
${
        marketData && Object.keys(marketData).length > 0
            ? Object.entries(marketData)
                .map(([id, data]) =>
                    `• ${id.toUpperCase()}: MCap $${formatNumber(data.usd_market_cap)}, Vol $${formatNumber(data.usd_24h_vol)}`
                )
                .join("\n")
            : "No market metrics provided"
    }

Agent Mode: ${agentMode}
Data Timestamp: ${
        marketData && Object.keys(marketData).length > 0
            ? new Date(
                Object.values(marketData)[0].last_updated_at * 1000
            ).toISOString()
            : new Date().toISOString()
    }

Instructions:
${getInstructionsForMode(agentMode)}
`.trim();
}

/**
 * Calculate current weights from portfolio allocations
 */
function calculateCurrentWeights(portfolio: Portfolio): CurrentWeight[] {
    if (!portfolio.allocations || portfolio.allocations.length === 0) {
        return [];
    }

    // Calculate total portfolio value
    const totalValue = portfolio.allocations.reduce(
        (sum, alloc) => sum + (alloc.currentValue || 0),
        0
    );

    if (totalValue === 0) {
        return portfolio.allocations.map(alloc => ({
            token: alloc.token?.symbol || alloc.tokenId || "UNKNOWN",
            target: alloc.percentage || 0,
            current: 0,
            deviation: -(alloc.percentage || 0),
        }));
    }

    return portfolio.allocations.map(alloc => {
        const current = ((alloc.currentValue || 0) / totalValue) * 100;
        const target = alloc.percentage || 0;
        const deviation = current - target;

        return {
            token: alloc.token?.symbol || alloc.tokenId || "UNKNOWN",
            target,
            current,
            deviation,
        };
    });
}

/**
 * Get recent rebalances from portfolio history
 */
function getRecentRebalances(portfolio: Portfolio): RecentRebalance[] {
    if (!portfolio.rebalanceLogs || portfolio.rebalanceLogs.length === 0) {
        return [];
    }

    // Get last 5 rebalances
    return portfolio.rebalanceLogs
        .slice(-5)
        .map(log => ({
            tokenInId: log.tokenInId || "N/A",
            tokenOutId: log.tokenOutId || "N/A",
            reason: log.reason || "No reason provided",
            timestamp: log.createdAt || log.timestamp,
        }));
}

/**
 * Get instructions based on agent mode
 */
function getInstructionsForMode(mode: string): string {
    switch (mode) {
        case "smart":
        case "urgent":
            return "You may dynamically adjust allocations based on market conditions, but keep changes moderate (max ±10% per token). Prioritize risk management and capital preservation.";

        case "manual":
            return "Only execute the specific rebalancing actions requested. Do not make autonomous decisions.";

        case "test":
            return "Simulate rebalancing decisions without executing transactions. Provide detailed reasoning for all recommendations.";

        case "auto":
        default:
            return "Maintain the user's target allocations. Only rebalance if deviations exceed 5%. Minimize transaction costs and avoid frequent small adjustments.";
    }
}

/**
 * Format large numbers for readability
 */
function formatNumber(num: number): string {
    if (num >= 1e9) return (num / 1e9).toFixed(2) + "B";
    if (num >= 1e6) return (num / 1e6).toFixed(2) + "M";
    if (num >= 1e3) return (num / 1e3).toFixed(2) + "K";
    return num.toFixed(2);
}