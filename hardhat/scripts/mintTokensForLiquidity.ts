import hre from "hardhat";

/**
 * Mint test tokens to your address for liquidity pools
 * 
 * Usage:
 * npx hardhat run scripts/mintTokensForLiquidity.ts --network monadTestnet
 */

async function main() {
    console.log("🪙 Minting test tokens for liquidity pools...\n");

    const [deployer] = await hre.viem.getWalletClients();
    const publicClient = await hre.viem.getPublicClient();

    const myAddress = deployer.account.address;
    console.log("Minting to address:", myAddress);

    // Check balance
    const balance = await publicClient.getBalance({ address: myAddress });
    console.log("Current MON balance:", (Number(balance) / 1e18).toFixed(4), "MON\n");

    // TestDAI contract
    const daiAddress = "0xCC0DF0CD04526faB0B3d396456257D059f439548";
    const dai = await hre.viem.getContractAt("TestDAI", daiAddress);

    // TestWETH contract
    const wethAddress = "0xb1F65f83C94Fe67EbA77299632e891C39c163Cf3";
    const weth = await hre.viem.getContractAt("TestWETH", wethAddress);

    console.log("=".repeat(60));
    console.log("Minting Tokens");
    console.log("=".repeat(60));

    // Mint 10,000 DAI
    console.log("\n📝 Minting 10,000 DAI...");
    await dai.write.mint([myAddress, 10000n]);
    console.log("✅ Minted 10,000 DAI");

    // Mint 10 WETH
    console.log("\n📝 Minting 10 WETH...");
    await weth.write.mint([myAddress, 10n]);
    console.log("✅ Minted 10 WETH");

    // Check balances
    console.log("\n" + "=".repeat(60));
    console.log("Token Balances");
    console.log("=".repeat(60));

    const daiBalance = await dai.read.balanceOf([myAddress]);
    const wethBalance = await weth.read.balanceOf([myAddress]);

    console.log("\n💰 Your Balances:");
    console.log("  DAI:", (Number(daiBalance) / 1e18).toLocaleString(), "DAI");
    console.log("  WETH:", (Number(wethBalance) / 1e18).toLocaleString(), "WETH");

    console.log("\n" + "=".repeat(60));
    console.log("✅ Tokens minted successfully!");
    console.log("=".repeat(60));

    console.log("\n📋 Next Steps:");
    console.log("1. Wrap some MON to WMON (need ~3-4 WMON for liquidity)");
    console.log("2. Go to a DEX (PancakeSwap, Uniswap, etc.)");
    console.log("3. Add liquidity for:");
    console.log("   - DAI/WMON pool");
    console.log("   - WETH/WMON pool");
    console.log("\n💡 See liquidity_pools_guide.md for detailed instructions");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
