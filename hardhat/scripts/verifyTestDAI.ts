import hre from "hardhat";

/**
 * Verify TestDAI contract on Monad block explorer
 * 
 * Usage:
 * npx hardhat run scripts/verifyTestDAI.ts --network monadTestnet
 */

async function main() {
    const contractAddress = "0xCC0DF0CD04526faB0B3d396456257D059f439548";
    const deployerAddress = "0xde9c18df0C7bef1ea3CFB08D8701daA2b92Bec5b";

    console.log("🔍 Verifying TestDAI contract...");
    console.log("Contract Address:", contractAddress);
    console.log("Constructor Args:", [deployerAddress]);
    console.log("=".repeat(60));

    try {
        await hre.run("verify:verify", {
            address: contractAddress,
            constructorArguments: [deployerAddress],
            contract: "contracts/tokens/TestDAI.sol:TestDAI"
        });

        console.log("\n✅ Successfully verified contract!");
        console.log(`View on explorer: https://explorer.monad.xyz/address/${contractAddress}`);
    } catch (error: any) {
        if (error.message.includes("Already Verified")) {
            console.log("\n✅ Contract is already verified!");
            console.log(`View on explorer: https://explorer.monad.xyz/address/${contractAddress}`);
        } else {
            console.error("\n❌ Verification failed:");
            console.error(error.message);
            throw error;
        }
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
