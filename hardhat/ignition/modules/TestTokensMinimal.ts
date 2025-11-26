import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

/**
 * Deploy only the 2 cheapest test tokens (TestDAI and TestWETH)
 * to conserve MON for liquidity pools and testing
 * 
 * Usage:
 * npx hardhat ignition deploy ignition/modules/TestTokensMinimal.ts --network monadTestnet
 */
export default buildModule("TestTokensMinimalModule", (m) => {
    const deployer = m.getAccount(0);

    // Deploy TestDAI (cheapest: 0.142978 MON)
    const dai = m.contract("TestDAI", [deployer], {
        id: "TestDAI",
    });

    // Deploy TestWETH (second cheapest: 0.142979 MON)
    const weth = m.contract("TestWETH", [deployer], {
        id: "TestWETH",
    });

    return { dai, weth };
});
