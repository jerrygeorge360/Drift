import hre from "hardhat";

/**
 * Wrap MON to WMON on Monad testnet
 * 
 * Usage:
 * npx hardhat run scripts/wrapMON.ts --network monadTestnet
 */

async function main() {
    console.log("🔄 Wrapping MON to WMON...\n");

    const [deployer] = await hre.viem.getWalletClients();
    const publicClient = await hre.viem.getPublicClient();

    const myAddress = deployer.account.address;
    console.log("Your address:", myAddress);

    // WMON contract address on Monad testnet
    const wmonAddress = "0x760AfE86e5de5fa0Ee542fc7B7B713e1c5425701";

    // Check MON balance
    const monBalance = await publicClient.getBalance({ address: myAddress });
    const monBalanceFormatted = (Number(monBalance) / 1e18).toFixed(4);
    console.log("MON Balance:", monBalanceFormatted, "MON");

    // Amount to wrap (in MON)
    const amountToWrap = 3; // Wrap 3 MON
    const amountInWei = BigInt(amountToWrap * 1e18);

    console.log("\n" + "=".repeat(60));
    console.log("Wrapping Details");
    console.log("=".repeat(60));
    console.log("Amount to wrap:", amountToWrap, "MON");
    console.log("WMON contract:", wmonAddress);

    // Check if you have enough MON
    if (monBalance < amountInWei) {
        console.error("\n❌ Error: Insufficient MON balance");
        console.error("Need:", amountToWrap, "MON");
        console.error("Have:", monBalanceFormatted, "MON");
        return;
    }

    // Get WMON contract (it's a standard WETH9 contract)
    const wmon = await hre.viem.getContractAt(
        "IWETH9",
        wmonAddress
    );

    console.log("\n📝 Calling deposit() to wrap MON...");

    // Wrap MON by calling deposit() with value
    const hash = await deployer.sendTransaction({
        to: wmonAddress,
        value: amountInWei,
        data: "0xd0e30db0" // deposit() function selector
    });

    console.log("Transaction hash:", hash);
    console.log("Waiting for confirmation...");

    // Wait for transaction
    const receipt = await publicClient.waitForTransactionReceipt({ hash });

    if (receipt.status === "success") {
        console.log("\n✅ Successfully wrapped", amountToWrap, "MON to WMON!");

        // Check WMON balance
        const wmonBalance = await publicClient.readContract({
            address: wmonAddress,
            abi: [{
                name: "balanceOf",
                type: "function",
                stateMutability: "view",
                inputs: [{ name: "account", type: "address" }],
                outputs: [{ name: "", type: "uint256" }]
            }],
            functionName: "balanceOf",
            args: [myAddress]
        });

        console.log("\n💰 Your Balances:");
        console.log("  WMON:", (Number(wmonBalance) / 1e18).toFixed(4), "WMON");

        const newMonBalance = await publicClient.getBalance({ address: myAddress });
        console.log("  MON:", (Number(newMonBalance) / 1e18).toFixed(4), "MON");

        console.log("\n" + "=".repeat(60));
        console.log("✅ Wrapping complete!");
        console.log("=".repeat(60));
        console.log("\n📋 Next Steps:");
        console.log("1. You now have WMON for liquidity pools");
        console.log("2. Go to MonadVision and add liquidity");
        console.log("3. Or use the addLiquidity script");
    } else {
        console.error("\n❌ Transaction failed");
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
