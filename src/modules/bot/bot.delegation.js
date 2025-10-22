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
exports.redeemDelegationService = redeemDelegationService;
var delegationhelpers_js_1 = require("../../utils/delegationhelpers.js");
var services_js_1 = require("../delegation/services.js");
var dbhelpers_js_1 = require("../../utils/dbhelpers.js");
var pimlico_1 = require("permissionless/clients/pimlico");
var chains_1 = require("viem/chains");
var viem_1 = require("viem");
var account_abstraction_1 = require("viem/account-abstraction");
function redeemDelegationService(smartAccountID, reBalance) {
    return __awaiter(this, void 0, void 0, function () {
        var delegation, delegationRecord, signedDelegation, bot, delegatePrivateKey, delegateSmartAccount, rpcUrl, pimlicoClient, paymasterClient;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!smartAccountID) {
                        throw new Error("Smart account id is required");
                    }
                    return [4 /*yield*/, (0, dbhelpers_js_1.getDelegationById)(smartAccountID)];
                case 1:
                    delegation = _a.sent();
                    if (!delegation) {
                        throw new Error("No stored delegation found in this smart account,seeing this means there is a bug in the system");
                    }
                    delegationRecord = delegation.signature ? delegation : null;
                    if (!delegationRecord) {
                        throw new Error("No valid signed delegation found");
                    }
                    signedDelegation = delegationRecord.signature;
                    return [4 /*yield*/, (0, dbhelpers_js_1.getBotByName)('Drift', true)];
                case 2:
                    bot = _a.sent();
                    if (!bot || !bot.encryptedKey)
                        throw new Error('Bot not found or missing key');
                    delegatePrivateKey = bot.privateKey;
                    if (!delegatePrivateKey) {
                        throw new Error("BOT_PRIVATE_KEY environment variable is missing");
                    }
                    return [4 /*yield*/, (0, delegationhelpers_js_1.reconstructSmartAccount)(delegatePrivateKey)];
                case 3:
                    delegateSmartAccount = _a.sent();
                    rpcUrl = 'https://api.pimlico.io/v2/10143/rpc?apikey=pim_WUqNB2JADYLUFKAY6TABdF';
                    pimlicoClient = (0, pimlico_1.createPimlicoClient)({
                        chain: chains_1.monadTestnet,
                        transport: (0, viem_1.http)(rpcUrl),
                    });
                    paymasterClient = (0, account_abstraction_1.createPaymasterClient)({
                        transport: (0, viem_1.http)(rpcUrl),
                    });
                    return [4 /*yield*/, (0, services_js_1.redeemDelegation)(signedDelegation, delegateSmartAccount, delegateSmartAccount.address, reBalance, rpcUrl, pimlicoClient, paymasterClient)];
                case 4: return [2 /*return*/, _a.sent()];
            }
        });
    });
}
