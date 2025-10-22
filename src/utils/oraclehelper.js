"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateAmounts = void 0;
var calculateAmounts = function (adjustment, allocations, marketData, totalValue) {
    var _a, _b, _c, _d;
    // Find the token being sold
    var tokenOutAllocation = allocations.find(function (a) { return a.token.id === adjustment.tokenOut; });
    if (!tokenOutAllocation) {
        throw new Error("Token ".concat(adjustment.tokenOut, " not found in portfolio"));
    }
    // Find the token being bought
    var tokenInAllocation = allocations.find(function (a) { return a.token.id === adjustment.tokenIn; });
    if (!tokenInAllocation) {
        throw new Error("Token ".concat(adjustment.tokenIn, " not found in portfolio"));
    }
    // Get current market prices
    var tokenOutPrice = (_b = (_a = marketData === null || marketData === void 0 ? void 0 : marketData[adjustment.tokenOut]) === null || _a === void 0 ? void 0 : _a.usd) !== null && _b !== void 0 ? _b : 1;
    var tokenInPrice = (_d = (_c = marketData === null || marketData === void 0 ? void 0 : marketData[adjustment.tokenIn]) === null || _c === void 0 ? void 0 : _c.usd) !== null && _d !== void 0 ? _d : 1;
    // Calculate the value to swap (percentage of total portfolio value)
    var swapValue = totalValue * (adjustment.percentage / 100);
    // Calculate amounts
    var amountOut = swapValue / tokenOutPrice;
    var amountIn = swapValue / tokenInPrice;
    return {
        amountOut: amountOut,
        amountIn: amountIn,
        swapValue: swapValue,
    };
};
exports.calculateAmounts = calculateAmounts;
