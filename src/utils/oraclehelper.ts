import {LLMAdjustment} from "../modules/bot/bot.types.js";

export const calculateAmounts = (adjustment:LLMAdjustment,allocations:any,marketData:any,totalValue:any) => {
    // Find the token being sold
    const tokenOutAllocation = allocations.find((a: any) => a.token.id === adjustment.tokenOutId);
    if (!tokenOutAllocation) {
        throw new Error(`Token ${adjustment.tokenOutId} not found in portfolio`);
    }

    // Get current market prices
    const tokenOutPrice = marketData?.[adjustment.tokenOutId]?.usd ?? 1;
    const tokenInPrice = marketData?.[adjustment.tokenInId]?.usd ?? 1;

    // Calculate the value to swap (percentage of total portfolio value)
    const swapValue = totalValue * (adjustment.percent / 100);

    // Calculate amounts
    const amountOut = swapValue / tokenOutPrice;
    const amountIn = swapValue / tokenInPrice;

    return {
        amountOut,
        amountIn,
        swapValue,
    };
};