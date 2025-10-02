import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("SmartPortfolioModule", (m) => {
    // Deploy mock tokens
    const tokenA = m.contract("MockERC20", ["TokenA", "TKA", 18]);
    const tokenB = m.contract("MockERC20", ["TokenB", "TKB", 18]);

    // Deploy mock router
    const router = m.contract("MockRouter");

    // Deploy SmartPortfolio with the router
    const portfolio = m.contract("SmartPortfolio", [router]);

    // Example: set allocations for deployer (50/50)
    m.call(portfolio, "setAllocations", [
        [
            [tokenA, 50n],
            [tokenB, 50n],
        ],
    ]);

    return { tokenA, tokenB, router, portfolio };
});
