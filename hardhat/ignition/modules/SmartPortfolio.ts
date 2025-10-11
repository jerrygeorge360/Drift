import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("SmartPortfolioModule", (m) => {
    const deployer = m.getAccount(0); // Your deployer account

    // Reference existing contracts with m.contractAt()
    const USDC = m.contractAt("MockToken", "0xf817257fed379853cDe0fa4F97AB987181B1E5Ea", { id: "USDC" });
    const USDT = m.contractAt("MockToken", "0x88b8E2161DEDC77EF4ab7585569D2415a1C1055D", { id: "USDT" });
    const WETH = m.contractAt("MockToken", "0xB5a30b0FDc5EA94A52fDc42e3E9760Cb8449Fb37", { id: "WETH" });
    const WSOL = m.contractAt("MockToken", "0x5387C85A4965769f6B0Df430638a1388493486F1", { id: "WSOL" });
    const WBTC = m.contractAt("MockToken", "0xcf5a6076cfa32686c0Df13aBaDa2b40dec133F1d", { id: "WBTC" });

    const router = m.contractAt("MockRouter", "0xfb8e1c3b833f9e67a71c859a132cf783b645e436");

    // Deploy your SmartPortfolio contract
    const portfolio = m.contract("SmartPortfolio", [router, deployer], { id: "Portfolio" });


    // Do NOT call setAllocation yet — users will do it themselves
    return { USDC, USDT, WETH,WSOL,WBTC, router, portfolio };
});