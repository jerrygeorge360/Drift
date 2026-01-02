import { getBotByName } from "../../utils/dbhelpers.js";
import { RebalancePortfolio, HealthState, RebalanceResult, RebalanceToken, RebalanceParams } from "./rebalancer.types.js";


// -----------------------------
// REBALANCE FUNCTION (MULTI-TOKEN)
// -----------------------------
export async function rebalancePortfolio(
    portfolio: RebalancePortfolio,
    prices: Record<string, number>,
    health?: Record<string, HealthState>,
    driftTolerance = 0.05
): Promise<RebalanceResult> {

    const BOT = await getBotByName('Drift');
    if (!BOT) {
        return { action: "NO_REBALANCE", reason: "Bot not found" };
    }
    const BotAddress = BOT.address;
    if (!BotAddress) {
        return { action: "NO_REBALANCE", reason: "Bot address not found" };
    }


    // 1. Compute total portfolio value in USD
    const totalValue = portfolio.tokens.reduce(
        (sum, t) => sum + t.balance * (prices[t.symbol] || 0),
        0
    );

    if (totalValue === 0) {
        return { action: "NO_REBALANCE", reason: "Portfolio value is zero" };
    }

    // 2. Compute drift for each token
    const drifts: RebalanceToken[] = portfolio.tokens.map(t => {
        const currentValue = t.balance * (prices[t.symbol] || 0);
        const targetValue = t.targetPercent * totalValue;
        const drift = (currentValue - targetValue) / targetValue;

        return { ...t, currentValue, targetValue, drift };
    });

    drifts.forEach(d => {
        console.log(`[Rebalancer] Token: ${d.symbol}, Balance: ${d.balance}, Price: ${prices[d.symbol]}, CurrentVal: ${d.currentValue?.toFixed(2)}, TargetVal: ${d.targetValue?.toFixed(2)}, Drift: ${(d.drift! * 100).toFixed(2)}%`);
    });

    const maxDrift = Math.max(...drifts.map(d => Math.abs(d.drift || 0)));
    if (maxDrift < driftTolerance) {
        return { action: "NO_REBALANCE", reason: "All tokens within drift tolerance" };
    }

    // 3. Split into BUYs and SELLs
    const sells = drifts
        .filter(d => (d.drift || 0) > driftTolerance)
        .sort((a, b) => (b.drift || 0) - (a.drift || 0));

    const buys = drifts
        .filter(d => (d.drift || 0) < -driftTolerance)
        .sort((a, b) => (a.drift || 0) - (b.drift || 0));

    const params: RebalanceParams[] = [];

    let i = 0;
    let j = 0;

    while (i < sells.length && j < buys.length) {
        const sell = sells[i];
        const buy = buys[j];

        // Skip unhealthy buy-side
        // if (health[buy.symbol] && health[buy.symbol] !== "HEALTHY") {
        //     j++;
        //     continue;
        // }

        // HYSTERESIS: Calculate full excess/need to bring to 0% drift (target value)
        const sellExcess = (sell.currentValue || 0) - (sell.targetValue || 0);
        const buyNeed = (buy.targetValue || 0) - (buy.currentValue || 0);

        const usdAmount = Math.min(sellExcess, buyNeed);
        if (usdAmount <= 0) {
            i++;
            j++;
            continue;
        }

        const tokenAmountIn = usdAmount / (prices[sell.symbol] || 1);
        const amountInWei = BigInt(Math.floor(tokenAmountIn * Math.pow(10, sell.decimals)));

        // SLIPPAGE PROTECTION: Get on-chain quote if portfolio address is available
        let amountOutMin = BigInt(0);
        if (portfolio.portfolioAddress) {
            try {
                const { getEstimatedOut } = await import("../../utils/blockchainhelpers.js");
                const swapPath = [sell.address, buy.address] as `0x${string}`[];
                const estimatedAmounts = await getEstimatedOut(
                    portfolio.portfolioAddress as `0x${string}`,
                    amountInWei,
                    swapPath
                );
                const expectedOut = estimatedAmounts[estimatedAmounts.length - 1];

                // Apply 1% slippage tolerance
                const slippageTolerance = 0.01;
                amountOutMin = BigInt(Math.floor(Number(expectedOut) * (1 - slippageTolerance)));

                console.log(`[Rebalancer] Quote for ${sell.symbol}→${buy.symbol}: Expected ${expectedOut}, Min ${amountOutMin} (1% slippage)`);
            } catch (error) {
                console.warn(`[Rebalancer] Could not get on-chain quote, using amountOutMin=0:`, error);
            }
        }

        params.push({
            botAddress: BotAddress,
            tokenIn: sell.address,
            tokenOut: buy.address,
            amountIn: amountInWei,
            amountOutMin: amountOutMin,
            swapPath: [sell.address, buy.address],
            reason: `Rebalance ${sell.symbol} → ${buy.symbol}`,
        });

        // Update values to reflect the trade (for multi-trade scenarios)
        sell.currentValue = (sell.currentValue || 0) - usdAmount;
        buy.currentValue = (buy.currentValue || 0) + usdAmount;

        // Move to next token pair when current pair is balanced
        if ((sell.currentValue || 0) <= (sell.targetValue || 0)) i++;
        if ((buy.currentValue || 0) >= (buy.targetValue || 0)) j++;
    }

    if (params.length === 0) {
        return {
            action: "NO_REBALANCE",
            reason: "No executable trades after health gating",
        };
    }

    return { action: "REBALANCE", params };
}


