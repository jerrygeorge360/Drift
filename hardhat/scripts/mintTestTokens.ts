import hre from "hardhat";

/**
 * Mint test tokens to specified addresses
 * 
 * Usage:
 * npx hardhat run scripts/mintTestTokens.ts --network monadTestnet
 */

async function main() {
    const [deployer] = await hre.viem.getWalletClients();

    console.log("Minting test tokens with account:", deployer.account.address);

    // Get deployed token addresses from Ignition deployments
    // You'll need to update these addresses after deployment
    const TOKENS = {
        USDC: "0x...", // Update after deployment
        USDT: "0x...", // Update after deployment
        WETH: "0x...", // Update after deployment
        DAI: "0x...",  // Update after deployment
        WBTC: "0x...", // Update after deployment
    };

    // Addresses to mint tokens to
    const recipients = [
        deployer.account.address, // Deployer
        // Add more addresses as needed
        // "0x1234...",
    ];

    // Mint amounts (in token units, not including decimals)
    const MINT_AMOUNTS = {
        USDC: 10000,  // 10,000 USDC
        USDT: 10000,  // 10,000 USDT
        WETH: 10,     // 10 WETH
        DAI: 10000,   // 10,000 DAI
        WBTC: 1,      // 1 WBTC
    };

    for (const recipient of recipients) {
        console.log(`\nMinting tokens to ${recipient}...`);

        // Mint USDC
        const usdc = await hre.viem.getContractAt("TestUSDC", TOKENS.USDC);
        await usdc.write.mint([recipient, BigInt(MINT_AMOUNTS.USDC)]);
        console.log(`✓ Minted ${MINT_AMOUNTS.USDC} USDC`);

        // Mint USDT
        const usdt = await hre.viem.getContractAt("TestUSDT", TOKENS.USDT);
        await usdt.write.mint([recipient, BigInt(MINT_AMOUNTS.USDT)]);
        console.log(`✓ Minted ${MINT_AMOUNTS.USDT} USDT`);

        // Mint WETH
        const weth = await hre.viem.getContractAt("TestWETH", TOKENS.WETH);
        await weth.write.mint([recipient, BigInt(MINT_AMOUNTS.WETH)]);
        console.log(`✓ Minted ${MINT_AMOUNTS.WETH} WETH`);

        // Mint DAI
        const dai = await hre.viem.getContractAt("TestDAI", TOKENS.DAI);
        await dai.write.mint([recipient, BigInt(MINT_AMOUNTS.DAI)]);
        console.log(`✓ Minted ${MINT_AMOUNTS.DAI} DAI`);

        // Mint WBTC
        const wbtc = await hre.viem.getContractAt("TestWBTC", TOKENS.WBTC);
        await wbtc.write.mint([recipient, BigInt(MINT_AMOUNTS.WBTC)]);
        console.log(`✓ Minted ${MINT_AMOUNTS.WBTC} WBTC`);
    }

    console.log("\n✅ All tokens minted successfully!");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
