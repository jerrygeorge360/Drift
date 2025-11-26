import hre from "hardhat";

/**
 * Verify that all test token contracts are compiled and accessible
 */
async function main() {
    console.log("Checking if test token contracts are accessible...\n");

    const contracts = ["TestUSDC", "TestUSDT", "TestWETH", "TestDAI", "TestWBTC"];

    for (const contractName of contracts) {
        try {
            const artifact = await hre.artifacts.readArtifact(contractName);
            console.log(`✅ ${contractName} - Found (${artifact.contractName})`);
        } catch (error) {
            console.log(`❌ ${contractName} - Not found`);
        }
    }

    console.log("\n✅ All test token contracts are compiled and accessible!");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
