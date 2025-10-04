import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("SmartPortfolioModule", (m) => {
    // Get the deployer's address using m.getAccount(0)
    const deployer = m.getAccount(0); // First account (default deployer)

    // Deploy mock tokens
    const tokenA = m.contract("MockToken", ["TokenA", "TKA"], { id: "TokenA" });
    const tokenB = m.contract("MockToken", ["TokenB", "TKB"], { id: "TokenB" });

    // Deploy mock router
    const router = m.contract("MockRouter", [], { id: "Router" });

    // Deploy SmartPortfolio
    // Pass 'router' (contract reference) and 'deployer' (address string) to constructor
    const portfolio = m.contract("SmartPortfolio", [router, deployer], { id: "Portfolio" });

    // Set allocation
    m.call(portfolio, "setAllocation", [
        [tokenA, tokenB], // Token contract references (resolved to addresses by Ignition)
        [20, 80],         // Percents
    ], { from: deployer });

    return { tokenA, tokenB, router, portfolio };
});