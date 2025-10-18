// SmartPortfolio Contract Address
const SMART_PORTFOLIO_ADDRESS: `0x${string}` = "0x065A0af7bfF900deB2Bcb7Ae3fc6e1dD52579aC7";

// Token addresses (Testnet)
const TOKENS = {
    USDC: "0xf817257fed379853cDe0fa4F97AB987181B1E5Ea",
    USDT: "0x88b8E2161DEDC77EF4ab7585569D2415a1C1055D",
    WBTC: "0xcf5a6076cfa32686c0Df13aBaDa2b40dec133F1d",
    WETH: "0xB5a30b0FDc5EA94A52fDc42e3E9760Cb8449Fb37",
    WSOL: "0x5387C85A4965769f6B0Df430638a1388493486F1"
} as const;

// Helper to get all addresses
const getAllTargets = (): `0x${string}`[] => {
    return [
        SMART_PORTFOLIO_ADDRESS,
        ...Object.values(TOKENS)
    ] as `0x${string}`[];
};

// Final SmartPortfolio Delegation Scope - SINGLE OBJECT
export const smartPortfolioScope = {
    type: "functionCall" as const,
    targets: getAllTargets(),
    selectors: [
        // SmartPortfolio contract functions
        "executeRebalance(address,address,address,uint256,uint256,address[],string)",
        "setAllocation(address[],uint16[])",
        "removeAllocation()",
        "revokeApproval(address)",
        // ERC20 token functions (will work on all token targets)
        "approve(address,uint256)",
        "transfer(address,uint256)"
    ]
};