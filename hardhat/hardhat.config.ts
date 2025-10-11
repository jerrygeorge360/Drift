import type { HardhatUserConfig } from "hardhat/config";
import hardhatToolboxViemPlugin from "@nomicfoundation/hardhat-toolbox-viem";
import { configVariable } from "hardhat/config";
import "@nomicfoundation/hardhat-ignition-viem"; // Add Ignition plugin for Viem
import * as dotenv from "dotenv";
dotenv.config();

const config: HardhatUserConfig = {
    plugins: [hardhatToolboxViemPlugin],
    solidity: {
        profiles: {
            default: {
                version: "0.8.28",
            },
            production: {
                version: "0.8.28",
                settings: {
                    optimizer: {
                        enabled: true,
                        runs: 200,
                    },
                },
            },
        },
    },
    networks: {
        hardhatMainnet: {
            type: "edr-simulated",
            chainType: "l1",
        },
        hardhatOp: {
            type: "edr-simulated",
            chainType: "op",
        },
        localhost: {
            type: "http",
            chainType: "l1",
            url: "http://127.0.0.1:8545",
            chainId: 31337,
        },
        sepolia: {
            type: "http",
            chainType: "l1",
            url: configVariable("SEPOLIA_RPC_URL"),
            accounts: [configVariable("SEPOLIA_PRIVATE_KEY")],
        },
        monadTestnet: {
            type: "http",
            chainType: "l1",
            url: configVariable("MONAD_TESTNET_RPC_URL"), // You’ll define this in your .env
            accounts: [configVariable("MONAD_TESTNET_PRIVATE_KEY")],
            chainId: 10143,
        },

    },
};

export default config;