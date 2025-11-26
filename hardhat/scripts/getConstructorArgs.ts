import { encodeAbiParameters } from "viem";

/**
 * Generate ABI-encoded constructor arguments for TestDAI verification
 */

async function main() {
    const deployerAddress = "0xde9c18df0C7bef1ea3CFB08D8701daA2b92Bec5b";

    // Encode constructor arguments
    const encoded = encodeAbiParameters(
        [{ type: 'address' }],
        [deployerAddress as `0x${string}`]
    );

    console.log("=".repeat(70));
    console.log("TestDAI Contract Verification Data");
    console.log("=".repeat(70));
    console.log("\n📋 Contract Information:");
    console.log("  Address:", "0xCC0DF0CD04526faB0B3d396456257D059f439548");
    console.log("  Name:", "TestDAI");
    console.log("  Compiler:", "v0.8.28");
    console.log("  Optimization:", "Disabled (default profile)");
    console.log("  EVM Version:", "cancun");

    console.log("\n🔧 Constructor Arguments:");
    console.log("  Deployer Address:", deployerAddress);
    console.log("  ABI-Encoded:", encoded);

    console.log("\n📝 For Manual Verification:");
    console.log("  1. Go to: https://explorer.monad.xyz/address/0xCC0DF0CD04526faB0B3d396456257D059f439548");
    console.log("  2. Click 'Verify & Publish'");
    console.log("  3. Select 'Solidity (Single file)'");
    console.log("  4. Compiler: v0.8.28");
    console.log("  5. Optimization: No");
    console.log("  6. EVM Version: cancun");
    console.log("  7. Upload: TestDAI_flat.sol");
    console.log("  8. Constructor Arguments (ABI-encoded):");
    console.log("     ", encoded);

    console.log("\n" + "=".repeat(70));
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
