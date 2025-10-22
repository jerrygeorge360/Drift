"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.executeRebalances = executeRebalances;
var bot_delegation_js_1 = require("./bot.delegation.js");
var oraclehelper_js_1 = require("../../utils/oraclehelper.js");
var viem_1 = require("viem");
/**
 * Execute rebalancing adjustments for a portfolio
 */
var s = [{
        tokenOut: "USDT", // Token to reduce/sell
        tokenIn: "USDC", // Token to increase/buy
        percentage: 10, // Percentage of portfolio to adjust
        reason: "hello", // Optional reason
    }];
function executeRebalances(bot_1, smartAccountId_1, portfolio_1) {
    return __awaiter(this, arguments, void 0, function (bot, smartAccountId, portfolio, adjustments, reason, marketData, totalValue) {
        var successfulRebalances, failedAdjustments, i, adj, tokenOutAllocation, tokenInAllocation, tokenOutAddresss, tokenInAddress, amounts, amountIn, amountOut, swapValue, tokenOutDecimals, tokenInDecimals, amountOutWei, amountInWei, minAmountInWei, rebalanceParams, txResult_1, userOpHash, transactionHash, error_1, executedCount, failedCount, totalCount, status;
        var _a;
        if (adjustments === void 0) { adjustments = s; }
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    console.log("\uD83E\uDD16 [".concat(bot.name, "] Starting rebalance cycle for SmartAccount: ").concat(smartAccountId));
                    // Validate inputs
                    if (!adjustments || adjustments.length === 0) {
                        console.log("\u26A0\uFE0F No adjustments provided, skipping execution");
                        return [2 /*return*/, {
                                status: "no_adjustments",
                                executedCount: 0,
                                failedCount: 0,
                                rebalanceResults: [],
                                failedAdjustments: [],
                                reason: "No adjustments to execute",
                                totalValue: totalValue,
                            }];
                    }
                    console.log("   Processing ".concat(adjustments.length, " adjustment(s)..."));
                    successfulRebalances = [];
                    failedAdjustments = [];
                    // 🔹 Calculate total portfolio value from allocations + live market data
                    console.log("\uD83D\uDCB0 Computed portfolio total value: $".concat(totalValue.toFixed(2)));
                    if (totalValue === 0) {
                        console.error("\u274C Portfolio has zero value, cannot rebalance");
                        return [2 /*return*/, {
                                status: "failed",
                                executedCount: 0,
                                failedCount: adjustments.length,
                                rebalanceResults: [],
                                failedAdjustments: adjustments.map(function (adj) { return ({
                                    adjustment: adj,
                                    error: "Portfolio has zero value",
                                }); }),
                                reason: "Portfolio value is zero",
                                totalValue: 0,
                            }];
                    }
                    i = 0;
                    _b.label = 1;
                case 1:
                    if (!(i < adjustments.length)) return [3 /*break*/, 6];
                    adj = adjustments[i];
                    console.log("\n\uD83D\uDCCA Processing adjustment ".concat(i + 1, "/").concat(adjustments.length, ":"));
                    console.log("   ".concat(adj.tokenOut, " \u2192 ").concat(adj.tokenIn, " (").concat(adj.percentage, "%)"));
                    _b.label = 2;
                case 2:
                    _b.trys.push([2, 4, , 5]);
                    tokenOutAllocation = findTokenAllocation(portfolio, adj.tokenOut);
                    tokenInAllocation = findTokenAllocation(portfolio, adj.tokenIn);
                    tokenOutAddresss = findTokenAddress(portfolio, adj.tokenOut);
                    tokenInAddress = findTokenAddress(portfolio, adj.tokenIn);
                    if (!tokenOutAllocation) {
                        throw new Error("Token ".concat(adj.tokenOut, " not found in portfolio"));
                    }
                    if (!tokenInAllocation) {
                        throw new Error("Token ".concat(adj.tokenIn, " not found in portfolio"));
                    }
                    if (!tokenOutAddresss) {
                        throw new Error("Token ".concat(adj.tokenOut, " not found in portfolio"));
                    }
                    if (!tokenInAddress) {
                        throw new Error("Token ".concat(adj.tokenIn, " not found in portfolio"));
                    }
                    amounts = (0, oraclehelper_js_1.calculateAmounts)(adj, portfolio.allocations, marketData, totalValue);
                    console.log(amounts, 'this is amount');
                    amountIn = amounts.amountIn, amountOut = amounts.amountOut, swapValue = amounts.swapValue;
                    console.log("   \uD83D\uDCB1 Swap Details:");
                    console.log("      Value: $".concat(swapValue.toFixed(2), " (").concat(adj.percentage, "% of portfolio)"));
                    console.log("      Out: ".concat(amountOut.toFixed(6), " ").concat(adj.tokenOut.toUpperCase()));
                    console.log("      In: ".concat(amountIn.toFixed(6), " ").concat(adj.tokenIn.toUpperCase()));
                    tokenOutDecimals = 18;
                    tokenInDecimals = 18;
                    amountOutWei = (0, viem_1.parseUnits)(amountOut.toString(), tokenOutDecimals);
                    amountInWei = (0, viem_1.parseUnits)(amountIn.toString(), tokenInDecimals);
                    minAmountInWei = (0, viem_1.parseUnits)((amountIn * 0.98).toString(), tokenInDecimals);
                    rebalanceParams = {
                        botAddress: bot.address,
                        tokenIn: tokenInAddress,
                        tokenOut: tokenOutAddresss,
                        amountOut: amountOutWei,
                        amountInMin: minAmountInWei,
                        swapPath: [
                            tokenOutAddresss,
                            tokenInAddress
                        ],
                        reason: adj.reason || reason,
                    };
                    console.log("   \uD83D\uDD04 Executing delegation redemption...");
                    return [4 /*yield*/, (0, bot_delegation_js_1.redeemDelegationService)(smartAccountId, rebalanceParams)];
                case 3:
                    txResult_1 = _b.sent();
                    console.log('execution result', txResult_1);
                    userOpHash = void 0;
                    transactionHash = void 0;
                    if (typeof txResult_1 === 'string') {
                        // Fast mode: only userOpHash returned
                        userOpHash = txResult_1;
                        transactionHash = txResult_1; // Use userOpHash as placeholder
                        console.log("   \u2705 User Operation submitted: ".concat(userOpHash));
                    }
                    else {
                        // Full mode: receipt with transaction hash
                        userOpHash = txResult_1.userOpHash;
                        transactionHash = txResult_1.transactionHash;
                        console.log("   \u2705 Transaction confirmed: ".concat(transactionHash));
                    }
                    return [3 /*break*/, 5];
                case 4:
                    error_1 = _b.sent();
                    console.error("\u274C Failed: ".concat(error_1.message));
                    console.error("\u274C Adjustment failed for ".concat(adj.tokenOut, " \u2192 ").concat(adj.tokenIn));
                    console.error("   Reason: ".concat(error_1.message));
                    console.error("   Stack: ".concat((_a = error_1.stack) === null || _a === void 0 ? void 0 : _a.split("\n")[0]));
                    failedAdjustments.push({
                        adjustment: adj,
                        error: error_1.message,
                        timestamp: new Date(),
                    });
                    return [3 /*break*/, 5];
                case 5:
                    i++;
                    return [3 /*break*/, 1];
                case 6:
                    executedCount = successfulRebalances.length;
                    failedCount = failedAdjustments.length;
                    totalCount = executedCount + failedCount;
                    if (executedCount === 0) {
                        status = "failed";
                    }
                    else if (failedCount === 0) {
                        status = "success";
                    }
                    else {
                        status = "partial";
                    }
                    console.log("\n\uD83D\uDCC8 Rebalance Summary:");
                    console.log("   Total: ".concat(totalCount));
                    console.log("   Successful: ".concat(executedCount));
                    console.log("   Failed: ".concat(failedCount));
                    console.log("   Status: ".concat(status.toUpperCase()));
                    return [2 /*return*/, {
                            status: status,
                            executedCount: executedCount,
                            failedCount: failedCount,
                            rebalanceResults: successfulRebalances,
                            failedAdjustments: failedAdjustments,
                            reason: reason,
                            totalValue: totalValue,
                        }];
            }
        });
    });
}
/**
 * Calculate total portfolio value from allocations and market data
 */
function calculatePortfolioValue(portfolio, marketData) {
    if (!portfolio.allocations || portfolio.allocations.length === 0) {
        return 0;
    }
    return portfolio.allocations.reduce(function (total, alloc) {
        var _a, _b, _c;
        var tokenId = alloc.tokenId || ((_b = (_a = alloc.token) === null || _a === void 0 ? void 0 : _a.symbol) === null || _b === void 0 ? void 0 : _b.toLowerCase());
        var price = ((_c = marketData === null || marketData === void 0 ? void 0 : marketData[tokenId]) === null || _c === void 0 ? void 0 : _c.usd) || 0;
        var amount = Number(alloc.amount || 0);
        return total + (amount * price);
    }, 0);
}
/**
 * Find token allocation in portfolio by symbol or ID
 */
function findTokenAllocation(portfolio, tokenSymbol) {
    if (!portfolio.allocations)
        return null;
    var searchTerm = tokenSymbol.toLowerCase();
    return portfolio.allocations.find(function (alloc) {
        var _a, _b, _c;
        var symbol = ((_b = (_a = alloc.token) === null || _a === void 0 ? void 0 : _a.symbol) === null || _b === void 0 ? void 0 : _b.toLowerCase()) || ((_c = alloc.tokenId) === null || _c === void 0 ? void 0 : _c.toLowerCase());
        return symbol === searchTerm;
    });
}
function findTokenAddress(portfolio, tokenSymbol) {
    var _a;
    if (!(portfolio === null || portfolio === void 0 ? void 0 : portfolio.allocations) || !Array.isArray(portfolio.allocations))
        return null;
    var searchTerm = tokenSymbol.toLowerCase();
    var allocation = portfolio.allocations.find(function (alloc) {
        var _a, _b, _c;
        var symbol = ((_b = (_a = alloc.token) === null || _a === void 0 ? void 0 : _a.symbol) === null || _b === void 0 ? void 0 : _b.toLowerCase()) || ((_c = alloc.tokenId) === null || _c === void 0 ? void 0 : _c.toLowerCase());
        return symbol === searchTerm;
    });
    // Return the token's address if found
    return ((_a = allocation === null || allocation === void 0 ? void 0 : allocation.token) === null || _a === void 0 ? void 0 : _a.address) || null;
}
var mar = {
    "usd-coin": {
        usd: 1,
        usd_market_cap: 76770942445.89798,
        usd_24h_vol: 21189195729.347694,
        usd_24h_change: -0.002882751937147867,
        last_updated_at: 1761126649,
    },
};
// const newbot = {'name':"Drift",'address':'0x1235aC2B678202802b5071a7AadF7efe0E172d0E'}
// const work = await executeRebalances(newbot,"f24a292e-d164-4416-b5cb-849693403d8b","1db590d1-8c8f-48ed-b383-eb12378edeb8",s,'fa',mar,120)
// console.log(work);
// const txResult = await redeemDelegationService(smartAccountId, rebalanceParams);
var txResult = await (0, bot_delegation_js_1.redeemDelegationService)("f24a292e-d164-4416-b5cb-849693403d8b", {
    botAddress: "0x1235aC2B678202802b5071a7AadF7efe0E172d0E",
    tokenIn: "0x2222222222222222222222222222222222222222", // USDC address
    tokenOut: "0x3333333333333333333333333333333333333333", // USDT address
    amountOut: BigInt("1000000000000000000"), // 1 USDT (in wei)
    amountInMin: BigInt("980000000000000000"), // 0.98 USDC (in wei)
    swapPath: [
        "0x3333333333333333333333333333333333333333",
        "0x2222222222222222222222222222222222222222",
    ],
    reason: "hello",
});
console.log(txResult);
