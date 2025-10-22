"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
exports.redeemDelegation = exports.createSignedDelegation = void 0;
var delegation_toolkit_1 = require("@metamask/delegation-toolkit");
var contracts_1 = require("@metamask/delegation-toolkit/contracts");
var viem_1 = require("viem");
var SmartPortfolio_json_1 = require("../../contracts/abi/SmartPortfolio.json");
var delegationConfig_js_1 = require("../../config/delegationConfig.js");
var account_abstraction_1 = require("viem/account-abstraction");
var chains_1 = require("viem/chains");
/**
 * Create a signed delegation
 */
var createSignedDelegation = function (delegatorSmartAccount, delegateSmartAccount) { return __awaiter(void 0, void 0, void 0, function () {
    var delegation, signature;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                delegation = (0, delegation_toolkit_1.createDelegation)({
                    to: delegateSmartAccount.address,
                    from: delegatorSmartAccount.address,
                    environment: delegatorSmartAccount.environment,
                    scope: delegationConfig_js_1.smartPortfolioScope,
                });
                return [4 /*yield*/, delegatorSmartAccount.signDelegation({
                        delegation: delegation,
                    })];
            case 1:
                signature = _a.sent();
                return [2 /*return*/, __assign(__assign({}, delegation), { signature: signature })];
        }
    });
}); };
exports.createSignedDelegation = createSignedDelegation;
/**
 * Redeem delegation with better gas handling + bundler pattern
 */
var redeemDelegation = function (signedDelegation, delegateSmartAccount, smartPortfolioAddress, rebalanceParams, rpcUrl, pimlicoClient, paymasterClient) { return __awaiter(void 0, void 0, void 0, function () {
    var publicClient, bundlerClient, rebalanceCalldata, executions, redeemDelegationCalldata, gasParams, pimlicoFee, err_1, gasEstimate, buffer, userOpHash, receipt, status_1, error_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 8, , 9]);
                console.log("\uD83D\uDD04 Preparing rebalance delegation...");
                publicClient = (0, viem_1.createPublicClient)({
                    chain: chains_1.monadTestnet,
                    transport: (0, viem_1.http)(),
                });
                bundlerClient = (0, account_abstraction_1.createBundlerClient)({
                    client: publicClient,
                    transport: (0, viem_1.http)(rpcUrl),
                });
                rebalanceCalldata = (0, viem_1.encodeFunctionData)({
                    abi: SmartPortfolio_json_1.default.abi,
                    functionName: "executeRebalance",
                    args: [
                        rebalanceParams.botAddress,
                        rebalanceParams.tokenIn,
                        rebalanceParams.tokenOut,
                        rebalanceParams.amountOut,
                        rebalanceParams.amountInMin,
                        rebalanceParams.swapPath,
                        rebalanceParams.reason,
                    ],
                });
                executions = (0, delegation_toolkit_1.createExecution)({
                    target: smartPortfolioAddress,
                    callData: rebalanceCalldata,
                });
                redeemDelegationCalldata = contracts_1.DelegationManager.encode.redeemDelegations({
                    delegations: [signedDelegation],
                    modes: [delegation_toolkit_1.ExecutionMode.SingleDefault],
                    executions: [[executions]],
                });
                gasParams = void 0;
                _a.label = 1;
            case 1:
                _a.trys.push([1, 3, , 5]);
                return [4 /*yield*/, pimlicoClient.getUserOperationGasPrice()];
            case 2:
                pimlicoFee = _a.sent();
                console.log("✅ Pimlico gas price:", pimlicoFee);
                gasParams = pimlicoFee.fast;
                return [3 /*break*/, 5];
            case 3:
                err_1 = _a.sent();
                console.warn("⚠️ Pimlico gas price failed, using fallback:", err_1);
                return [4 /*yield*/, publicClient.estimateFeesPerGas()];
            case 4:
                gasEstimate = _a.sent();
                buffer = 150n;
                gasParams = {
                    maxFeePerGas: (gasEstimate.maxFeePerGas * buffer) / 100n,
                    maxPriorityFeePerGas: (gasEstimate.maxPriorityFeePerGas * buffer) / 100n,
                };
                return [3 /*break*/, 5];
            case 5:
                console.log("🚀 Redeeming delegation with gas params:", gasParams);
                return [4 /*yield*/, bundlerClient.sendUserOperation({
                        account: delegateSmartAccount,
                        calls: [
                            {
                                to: delegateSmartAccount.address,
                                data: redeemDelegationCalldata,
                            },
                        ],
                        maxFeePerGas: gasParams.maxFeePerGas,
                        maxPriorityFeePerGas: gasParams.maxPriorityFeePerGas,
                        paymaster: paymasterClient,
                    })];
            case 6:
                userOpHash = _a.sent();
                console.log("📤 Sent User Operation:", userOpHash);
                console.log("⏳ Waiting for confirmation...");
                return [4 /*yield*/, bundlerClient.waitForUserOperationReceipt({
                        hash: userOpHash,
                    })];
            case 7:
                receipt = (_a.sent()).receipt;
                console.log("✅ Delegation redeemed!");
                console.log("   TX Hash:", receipt.transactionHash);
                console.log("   Block:", receipt.blockNumber);
                console.log("   Status:", receipt.status);
                status_1 = receipt.status === "success" ? "success" : "reverted";
                if (status_1 === "reverted") {
                    throw new Error("Transaction reverted: ".concat(receipt.transactionHash));
                }
                return [2 /*return*/, {
                        userOpHash: userOpHash,
                        transactionHash: receipt.transactionHash,
                        blockNumber: receipt.blockNumber,
                        status: status_1,
                        gasUsed: receipt.gasUsed,
                    }];
            case 8:
                error_1 = _a.sent();
                console.error("❌ Failed to redeem delegation:", error_1);
                throw new Error("Delegation redemption failed: ".concat(error_1.message));
            case 9: return [2 /*return*/];
        }
    });
}); };
exports.redeemDelegation = redeemDelegation;
