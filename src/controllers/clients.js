"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.publicClient = void 0;
var viem_1 = require("viem");
var chains_1 = require("viem/chains");
exports.publicClient = (0, viem_1.createPublicClient)({
    chain: chains_1.monadTestnet,
    transport: (0, viem_1.http)(),
});
