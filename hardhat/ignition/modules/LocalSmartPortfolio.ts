import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("SmartPortfolioModule", (m) => {
    const deployer = m.getAccount(0);

    // Reference existing contracts with addresses from local deployment
    const USDC = m.contractAt("MockToken", "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512", { id: "USDC" });
    const USDT = m.contractAt("MockToken", "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0", { id: "USDT" });
    const WETH = m.contractAt("MockToken", "0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9", { id: "WETH" });
    const WSOL = m.contractAt("MockToken", "0x5FC8d32690cc91D4c39d9d3abcBD16989F875707", { id: "WSOL" });
    const WBTC = m.contractAt("MockToken", "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9", { id: "WBTC" });

    const router = m.contractAt("MockRouter", "0x5FbDB2315678afecb367f032d93F642f64180aa3");

    // Deploy SmartPortfolio
    const portfolio = m.contract("SmartPortfolio", [router, deployer], {
        id: "Portfolio",
    });

    return { USDC, USDT, WETH, WSOL, WBTC, router, portfolio };
});