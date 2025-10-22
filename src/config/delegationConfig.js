"use strict";
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.smartPortfolioScope = void 0;
// SmartPortfolio Contract Address
var SMART_PORTFOLIO_ADDRESS = "0x065A0af7bfF900deB2Bcb7Ae3fc6e1dD52579aC7";
// Token addresses (Testnet)
var TOKENS = {
    USDC: "0xf817257fed379853cDe0fa4F97AB987181B1E5Ea",
    USDT: "0x88b8E2161DEDC77EF4ab7585569D2415a1C1055D",
    WBTC: "0xcf5a6076cfa32686c0Df13aBaDa2b40dec133F1d",
    WETH: "0xB5a30b0FDc5EA94A52fDc42e3E9760Cb8449Fb37",
    WSOL: "0x5387C85A4965769f6B0Df430638a1388493486F1"
};
// Helper to get all addresses
var getAllTargets = function () {
    return __spreadArray([
        SMART_PORTFOLIO_ADDRESS
    ], Object.values(TOKENS), true);
};
// Final SmartPortfolio Delegation Scope - SINGLE OBJECT
exports.smartPortfolioScope = {
    type: "functionCall",
    targets: getAllTargets(),
    selectors: [
        // SmartPortfolio contract functions
        "executeRebalance(address,address,address,uint256,uint256,address[],string)",
        "setAllocation(address[],uint16[])",
        "removeAllocation()",
        "revokeApproval(address)",
        // ERC20 token functions (will work on all token targets)
        "approve(address,uint256)",
        "transfer(address,uint256)"
    ]
};
