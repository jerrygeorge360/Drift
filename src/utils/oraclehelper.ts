import { LLMAdjustment } from "../modules/bot/bot.types.js";

export const calculateAmounts = (
    adjustment: LLMAdjustment,
    allocations: any,
    marketData: any,
    totalValue: any
) => {
    // Find the token being sold
    const tokenOutAllocation = allocations.find(
        (a: any) => a.token.id === adjustment.tokenOut
    );
    if (!tokenOutAllocation) {
        throw new Error(`Token ${adjustment.tokenOut} not found in portfolio`);
    }

    // Find the token being bought
    const tokenInAllocation = allocations.find(
        (a: any) => a.token.id === adjustment.tokenIn
    );
    if (!tokenInAllocation) {
        throw new Error(`Token ${adjustment.tokenIn} not found in portfolio`);
    }

    // Get current market prices
    const tokenOutPrice = marketData?.[adjustment.tokenOut]?.usd ?? 1;
    const tokenInPrice = marketData?.[adjustment.tokenIn]?.usd ?? 1;

    // Calculate the value to swap (percentage of total portfolio value)
    const swapValue = totalValue * (adjustment.percentage / 100);

    // Calculate amounts
    const amountOut = swapValue / tokenOutPrice;
    const amountIn = swapValue / tokenInPrice;

    return {
        amountOut,
        amountIn,
        swapValue,
    };
};
