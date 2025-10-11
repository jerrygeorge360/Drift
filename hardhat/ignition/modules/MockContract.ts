import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("MockContractsModule", (m) => {
    // Deploy mock tokens
    const USDC = m.contract("MockToken", ["USD Coin", "USDC"], { id: "USDC" });
    const USDT = m.contract("MockToken", ["Tether", "USDT"], { id: "USDT" });
    const WETH = m.contract("MockToken", ["Wrapped ETH", "WETH"], { id: "WETH" });
    const WSOL = m.contract("MockToken", ["Wrapped SOL", "WSOL"], { id: "WSOL" });
    const WBTC = m.contract("MockToken", ["Wrapped BTC", "WBTC"], { id: "WBTC" });

    // Deploy mock router
    const router = m.contract("MockRouter", []);

    return { USDC, USDT, WETH, WSOL, WBTC, router };
});