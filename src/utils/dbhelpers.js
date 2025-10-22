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
exports.deleteToken = exports.getAllTokens = void 0;
exports.findOrCreateUser = findOrCreateUser;
exports.getUserById = getUserById;
exports.deleteUserById = deleteUserById;
exports.getAllUsers = getAllUsers;
exports.updateUserLastLogin = updateUserLastLogin;
exports.createSmartAccountdb = createSmartAccountdb;
exports.getUserSmartAccounts = getUserSmartAccounts;
exports.findSmartAccountByAddress = findSmartAccountByAddress;
exports.deleteSmartAccountById = deleteSmartAccountById;
exports.findSmartAccountById = findSmartAccountById;
exports.createDelegationdb = createDelegationdb;
exports.getDelegationsBySmartAccount = getDelegationsBySmartAccount;
exports.getDelegationById = getDelegationById;
exports.revokeDelegation = revokeDelegation;
exports.isValidDelegation = isValidDelegation;
exports.getPortfolioBySmartAccountId = getPortfolioBySmartAccountId;
exports.updatePortfolioName = updatePortfolioName;
exports.createPortfolio = createPortfolio;
exports.setPortfolioAllocations = setPortfolioAllocations;
exports.getPortfolioAllocations = getPortfolioAllocations;
exports.deletePortfolioAllocation = deletePortfolioAllocation;
exports.deleteAllPortfolioAllocations = deleteAllPortfolioAllocations;
exports.createRebalanceLog = createRebalanceLog;
exports.getRebalanceLogs = getRebalanceLogs;
exports.findTokenBySymbol = findTokenBySymbol;
exports.findTokenByAddress = findTokenByAddress;
exports.createToken = createToken;
exports.getContractConfigByAddress = getContractConfigByAddress;
exports.createOrUpdateContractConfig = createOrUpdateContractConfig;
exports.getAllContractConfigs = getAllContractConfigs;
exports.updateContractPauseStatus = updateContractPauseStatus;
exports.deleteContractConfig = deleteContractConfig;
exports.createBot = createBot;
exports.getAllBots = getAllBots;
exports.getBotById = getBotById;
exports.updateBot = updateBot;
exports.getBotByName = getBotByName;
exports.deleteBot = deleteBot;
var db_js_1 = require("../config/db.js");
var encryption_js_1 = require("./encryption.js");
//
// USER
//
// Find or create user by walletAddress
function findOrCreateUser(walletAddress) {
    return __awaiter(this, void 0, void 0, function () {
        var user;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, db_js_1.default.user.findUnique({
                        where: { walletAddress: walletAddress },
                    })];
                case 1:
                    user = _a.sent();
                    if (!!user) return [3 /*break*/, 3];
                    return [4 /*yield*/, db_js_1.default.user.create({
                            data: { walletAddress: walletAddress },
                        })];
                case 2:
                    user = _a.sent();
                    _a.label = 3;
                case 3: return [2 /*return*/, user];
            }
        });
    });
}
function getUserById(userId) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, db_js_1.default.user.findUnique({
                    where: { id: userId },
                })];
        });
    });
}
// Delete user by ID
function deleteUserById(userId) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            // Also consider cascading deletes if needed, or handle relations carefully
            return [2 /*return*/, db_js_1.default.user.delete({
                    where: { id: userId },
                })];
        });
    });
}
// List all users
function getAllUsers() {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, db_js_1.default.user.findMany()];
        });
    });
}
// Update user last login timestamp
function updateUserLastLogin(userId) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, db_js_1.default.user.update({
                    where: { id: userId },
                    data: { lastLogin: new Date() },
                })];
        });
    });
}
//
// SMART ACCOUNT
//
// Create new smart account for user + create portfolio automatically (one-to-one)
function createSmartAccountdb(userId_1, address_1, privateKey_1) {
    return __awaiter(this, arguments, void 0, function (userId, address, privateKey, portfolioName, ownerAddress) {
        if (portfolioName === void 0) { portfolioName = "Default Portfolio"; }
        return __generator(this, function (_a) {
            return [2 /*return*/, db_js_1.default.smartAccount.create({
                    data: {
                        userId: userId,
                        address: address,
                        privateKey: privateKey, // encrypt before storing in production!
                        portfolio: {
                            create: {
                                name: portfolioName,
                            },
                        },
                        ownerAddress: ownerAddress,
                    },
                    include: {
                        portfolio: true,
                    },
                })];
        });
    });
}
// Get all smart accounts for a user (include portfolio)
function getUserSmartAccounts(userId) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, db_js_1.default.smartAccount.findMany({
                    where: { userId: userId },
                    include: {
                        portfolio: {
                            include: {
                                allocations: true,
                                rebalanceLogs: true,
                            },
                        },
                    },
                })];
        });
    });
}
// Find smart account by address (include portfolio)
function findSmartAccountByAddress(address) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, db_js_1.default.smartAccount.findUnique({
                    where: { address: address },
                    include: {
                        portfolio: {
                            include: {
                                allocations: true,
                                rebalanceLogs: true,
                            },
                        },
                    },
                })];
        });
    });
}
function deleteSmartAccountById(id) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, db_js_1.default.smartAccount.delete({
                    where: { id: id },
                })];
        });
    });
}
function findSmartAccountById(id) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, db_js_1.default.smartAccount.findUnique({
                    where: { id: id },
                })];
        });
    });
}
//
// DELEGATION
//
function createDelegationdb(data) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, db_js_1.default.delegation.create({
                    data: {
                        smartAccountId: data.smartAccountId,
                        delegatorAddress: data.delegatorSmartAccount.address,
                        delegateAddress: data.delegateSmartAccount.address,
                        signature: data.signature,
                        expiresAt: data.expiresAt,
                    },
                })];
        });
    });
}
function getDelegationsBySmartAccount(smartAccountId) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, db_js_1.default.delegation.findMany({
                    where: { smartAccountId: smartAccountId, revoked: false },
                })];
        });
    });
}
function getDelegationById(id) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, db_js_1.default.delegation.findUnique({
                    where: { id: id },
                })];
        });
    });
}
function revokeDelegation(id) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, db_js_1.default.delegation.update({
                    where: { id: id },
                    data: { revoked: true },
                })];
        });
    });
}
function isValidDelegation(delegateAddress, smartAccountId, requiredScope) {
    return __awaiter(this, void 0, void 0, function () {
        var delegations;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, db_js_1.default.delegation.findMany({
                        where: {
                            delegateAddress: delegateAddress,
                            smartAccountId: smartAccountId,
                            revoked: false,
                            expiresAt: {
                                gt: new Date(),
                            },
                        },
                    })];
                case 1:
                    delegations = _a.sent();
                    return [2 /*return*/, delegations.length > 0];
            }
        });
    });
}
//
// PORTFOLIO
//
// Get portfolio by smart account id (only one portfolio per smart account)
function getPortfolioBySmartAccountId(smartAccountId) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, db_js_1.default.portfolio.findUnique({
                    where: { smartAccountId: smartAccountId },
                    include: {
                        allocations: {
                            include: {
                                token: true,
                            },
                        },
                        rebalanceLogs: {
                            orderBy: { createdAt: "desc" },
                        },
                    },
                })];
        });
    });
}
// Update portfolio name by smartAccountId
function updatePortfolioName(smartAccountId, newName) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, db_js_1.default.portfolio.update({
                    where: { smartAccountId: smartAccountId },
                    data: { name: newName },
                })];
        });
    });
}
// create portfolio(initialization)
function createPortfolio(smartAccountId, name) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, db_js_1.default.portfolio.create({
                    data: {
                        smartAccountId: smartAccountId,
                        name: name,
                    },
                })];
        });
    });
}
//
// PORTFOLIO ALLOCATION
//
// Set allocations for portfolio (replace old allocations)
function setPortfolioAllocations(portfolioId, allocations) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: 
                // Delete existing allocations and recreate
                return [4 /*yield*/, db_js_1.default.portfolioAllocation.deleteMany({
                        where: { portfolioId: portfolioId },
                    })];
                case 1:
                    // Delete existing allocations and recreate
                    _a.sent();
                    // Bulk create new allocations
                    return [2 /*return*/, db_js_1.default.portfolioAllocation.createMany({
                            data: allocations.map(function (_a) {
                                var tokenId = _a.tokenId, percent = _a.percent;
                                return ({
                                    portfolioId: portfolioId,
                                    tokenId: tokenId,
                                    percent: percent,
                                });
                            }),
                        })];
            }
        });
    });
}
// Get allocations for a portfolio
function getPortfolioAllocations(portfolioId) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, db_js_1.default.portfolioAllocation.findMany({
                    where: { portfolioId: portfolioId },
                    include: { token: true },
                })];
        });
    });
}
// Delete a single token allocation from a portfolio
function deletePortfolioAllocation(portfolioId, tokenId) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, db_js_1.default.portfolioAllocation.deleteMany({
                    where: {
                        portfolioId: portfolioId,
                        tokenId: tokenId,
                    },
                })];
        });
    });
}
// Delete all allocations for a portfolio
function deleteAllPortfolioAllocations(portfolioId) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, db_js_1.default.portfolioAllocation.deleteMany({
                    where: { portfolioId: portfolioId },
                })];
        });
    });
}
// Log a rebalance event
function createRebalanceLog(data) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            if (Array.isArray(data)) {
                // 🧩 Bulk insert (createMany only accepts scalar fields — no nested connect)
                return [2 /*return*/, db_js_1.default.rebalanceLog.createMany({
                        data: data.map(function (d) { return ({
                            portfolioId: d.portfolioId,
                            tokenInId: d.tokenInId,
                            tokenOutId: d.tokenOutId,
                            amountIn: d.amountIn,
                            amountOut: d.amountOut,
                            reason: d.reason,
                            executor: d.executor,
                        }); }),
                        skipDuplicates: true,
                    })];
            }
            // 🧩 Single insert
            return [2 /*return*/, db_js_1.default.rebalanceLog.create({
                    data: {
                        portfolioId: data.portfolioId,
                        tokenInId: data.tokenInId,
                        tokenOutId: data.tokenOutId,
                        amountIn: data.amountIn,
                        amountOut: data.amountOut,
                        reason: data.reason,
                        executor: data.executor,
                    },
                })];
        });
    });
}
// Get rebalance logs for a portfolio
function getRebalanceLogs(portfolioId_1) {
    return __awaiter(this, arguments, void 0, function (portfolioId, limit) {
        if (limit === void 0) { limit = 50; }
        return __generator(this, function (_a) {
            return [2 /*return*/, db_js_1.default.rebalanceLog.findMany({
                    where: { portfolioId: portfolioId },
                    orderBy: { createdAt: "desc" },
                    take: limit,
                    include: {
                        tokenIn: true,
                        tokenOut: true,
                    },
                })];
        });
    });
}
//
// TOKEN
//
// Find token by symbol or address
function findTokenBySymbol(symbol) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, db_js_1.default.token.findUnique({ where: { symbol: symbol } })];
        });
    });
}
function findTokenByAddress(address) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, db_js_1.default.token.findUnique({ where: { address: address } })];
        });
    });
}
// Create a new token (if needed)
function createToken(data) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, db_js_1.default.token.create({ data: data })];
        });
    });
}
var getAllTokens = function () { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        return [2 /*return*/, db_js_1.default.token.findMany({
                orderBy: { createdAt: 'desc' },
            })];
    });
}); };
exports.getAllTokens = getAllTokens;
var deleteToken = function (id) { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        return [2 /*return*/, db_js_1.default.token.delete({ where: { id: id } })];
    });
}); };
exports.deleteToken = deleteToken;
//
// CONTRACT CONFIG
//
function getContractConfigByAddress(address) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, db_js_1.default.contractConfig.findUnique({ where: { contractAddress: address } })];
        });
    });
}
function createOrUpdateContractConfig(data) {
    return __awaiter(this, void 0, void 0, function () {
        var _a;
        return __generator(this, function (_b) {
            return [2 /*return*/, db_js_1.default.contractConfig.upsert({
                    where: { contractAddress: data.contractAddress },
                    update: {
                        network: data.network,
                        owner: data.owner,
                        paused: data.paused,
                        updatedAt: new Date(),
                    },
                    create: {
                        contractAddress: data.contractAddress,
                        network: data.network,
                        owner: data.owner,
                        paused: (_a = data.paused) !== null && _a !== void 0 ? _a : false,
                    },
                })];
        });
    });
}
function getAllContractConfigs(network) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, db_js_1.default.contractConfig.findMany({
                    where: network ? { network: network } : undefined,
                    orderBy: { createdAt: "desc" },
                })];
        });
    });
}
function updateContractPauseStatus(contractAddress, paused) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, db_js_1.default.contractConfig.update({
                    where: { contractAddress: contractAddress },
                    data: { paused: paused },
                })];
        });
    });
}
function deleteContractConfig(contractAddress) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, db_js_1.default.contractConfig.delete({
                    where: { contractAddress: contractAddress },
                })];
        });
    });
}
//
// BOT
//
function createBot(data) {
    return __awaiter(this, void 0, void 0, function () {
        var encryptedKey;
        return __generator(this, function (_a) {
            encryptedKey = (0, encryption_js_1.encryptPrivateKey)(data.privateKey);
            return [2 /*return*/, db_js_1.default.bot.create({
                    data: {
                        name: data.name,
                        description: data.description,
                        address: data.address, // ✅ required
                        encryptedKey: encryptedKey,
                        role: data.role || "bot",
                        status: data.status || "active",
                    },
                })];
        });
    });
}
// Get all bots
function getAllBots() {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, db_js_1.default.bot.findMany({
                    orderBy: { createdAt: "desc" },
                })];
        });
    });
}
// Get bot by ID (decrypted private key optional)
function getBotById(botId_1) {
    return __awaiter(this, arguments, void 0, function (botId, withPrivateKey) {
        var bot, decrypted;
        if (withPrivateKey === void 0) { withPrivateKey = false; }
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, db_js_1.default.bot.findUnique({ where: { id: botId } })];
                case 1:
                    bot = _a.sent();
                    if (!bot)
                        return [2 /*return*/, null];
                    if (withPrivateKey && bot.encryptedKey) {
                        decrypted = (0, encryption_js_1.decryptPrivateKey)(bot.encryptedKey);
                        return [2 /*return*/, __assign(__assign({}, bot), { privateKey: decrypted })];
                    }
                    return [2 /*return*/, bot];
            }
        });
    });
}
//  Update bot info (optional private key update)
function updateBot(botName, data) {
    return __awaiter(this, void 0, void 0, function () {
        var updateData;
        return __generator(this, function (_a) {
            updateData = __assign({}, data);
            if (data.privateKey) {
                updateData.encryptedKey = (0, encryption_js_1.encryptPrivateKey)(data.privateKey);
                delete updateData.privateKey;
            }
            return [2 /*return*/, db_js_1.default.bot.update({
                    where: { name: botName },
                    data: updateData,
                })];
        });
    });
}
function getBotByName(name_1) {
    return __awaiter(this, arguments, void 0, function (name, withPrivateKey) {
        var bot, decrypted;
        if (withPrivateKey === void 0) { withPrivateKey = false; }
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, db_js_1.default.bot.findUnique({ where: { name: name } })];
                case 1:
                    bot = _a.sent();
                    if (!bot)
                        return [2 /*return*/, null];
                    // If requested, decrypt the private key
                    if (withPrivateKey && bot.encryptedKey) {
                        decrypted = (0, encryption_js_1.decryptPrivateKey)(bot.encryptedKey);
                        return [2 /*return*/, __assign(__assign({}, bot), { privateKey: decrypted })];
                    }
                    return [2 /*return*/, bot];
            }
        });
    });
}
// Delete bot
function deleteBot(botId) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, db_js_1.default.bot.delete({ where: { id: botId } })];
        });
    });
}
