import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

/**
 * Deploy all test tokens to testnet (Monad, Sepolia, etc.)
 * 
 * Usage:
 * npx hardhat ignition deploy ignition/modules/TestTokens.ts --network monadTestnet
 */
export default buildModule("TestTokensModule", (m) => {
    const deployer = m.getAccount(0);

    // Deploy test tokens with deployer as initial owner
    const usdc = m.contract("TestUSDC", [deployer], {
        id: "TestUSDC",
    });

    const usdt = m.contract("TestUSDT", [deployer], {
        id: "TestUSDT",
    });

    const weth = m.contract("TestWETH", [deployer], {
        id: "TestWETH",
    });

    const dai = m.contract("TestDAI", [deployer], {
        id: "TestDAI",
    });

    const wbtc = m.contract("TestWBTC", [deployer], {
        id: "TestWBTC",
    });

    return { usdc, usdt, weth, dai, wbtc };
});
