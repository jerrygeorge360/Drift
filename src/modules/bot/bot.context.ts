import {MarketData} from "./bot.agent.js";

export function buildLLMContext(
    portfolio: any,
    marketData: any,
    currentWeights: any,
    recentRebalances: any,
    agentMode: string
) {
    // @ts-ignore
    // @ts-ignore
    return `
Portfolio: ${portfolio.name}

Allocations (Target vs Current):
${currentWeights
        .map(
            (w: any) =>
                `- ${w.token}: Target ${w.target.toFixed(2)}%, Current ${w.current.toFixed(
                    2
                )}%, Deviation ${w.deviation.toFixed(2)}%`
        )
        .join("\n")}

Recent Rebalances:
${
        recentRebalances.length
            ? recentRebalances
                .map((r: any) => `• In: ${r.tokenInId}, Out: ${r.tokenOutId}, Reason: ${r.reason}`)
                .join("\n")
            : "None yet."
    }

Market Summary:
${
        marketData
            ? Object.entries(marketData)
                .map(([id, data]: any) => `• ${id.toUpperCase()}: $${data.usd.toFixed(2)}`)
                .join("\n")
            : "No market data provided"
    }

Volatility (24h Change):
${
        marketData
            ? Object.entries(marketData)
                .map(([id, data]: any) => `• ${id.toUpperCase()}: ${data.usd_24h_change.toFixed(2)}%`)
                .join("\n")
            : "No volatility data provided"
    }

Agent Mode: ${agentMode}
Data Timestamp: ${
        marketData
            ? new Date(
                (Object.values(marketData)[0] as MarketData[string]).last_updated_at * 1000
            ).toISOString()
            : "N/A"

    }

Instructions:
${
        agentMode === "smart"
            ? "You may dynamically adjust allocations based on market conditions, but keep changes moderate (max ±10% per token)."
            : "Maintain the user's target allocations. Only rebalance if deviations exceed 5%."
    }
`;
}
