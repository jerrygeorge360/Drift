import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Fix for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
    console.log("📦 Preparing TestDAI verification JSON from build info...\n");

    // Find the build info file for TestDAI
    const buildInfoDir = path.join(
        __dirname,
        "..",
        "ignition",
        "deployments",
        "chain-10143",
        "build-info"
    );

    // Get the latest build info file
    const buildInfoFiles = fs.readdirSync(buildInfoDir);
    const latestBuildInfo = buildInfoFiles.sort().reverse()[0];

    const buildInfoPath = path.join(buildInfoDir, latestBuildInfo);

    console.log("Using build info:", latestBuildInfo);

    if (!fs.existsSync(buildInfoPath)) {
        throw new Error("Build info file not found at: " + buildInfoPath);
    }

    const buildInfo = JSON.parse(fs.readFileSync(buildInfoPath, "utf8"));

    // Extract the standard JSON input
    const standardJsonInput = buildInfo.input;

    // Create verification directory
    const verificationDir = path.join(__dirname, "..", "verification");
    if (!fs.existsSync(verificationDir)) {
        fs.mkdirSync(verificationDir, { recursive: true });
    }

    // Save the standard JSON input for TestDAI
    const outputPath = path.join(verificationDir, "testdai-standard-json-input.json");
    fs.writeFileSync(outputPath, JSON.stringify(standardJsonInput, null, 2));

    console.log("✅ Standard JSON Input saved to:");
    console.log("   " + outputPath);

    // Encode constructor arguments for TestDAI (only deployer address)
    const { encodeAbiParameters, parseAbiParameters } = await import("viem");
    const deployerAddress = "0xde9c18df0C7bef1ea3CFB08D8701daA2b92Bec5b";

    const encoded = encodeAbiParameters(
        parseAbiParameters('address'),
        [deployerAddress as `0x${string}`]
    );

    const argsContent = `ABI-Encoded Constructor Arguments for TestDAI
═══════════════════════════════════════════════

Without 0x prefix (use this for verification):
${encoded.slice(2)}

With 0x prefix:
${encoded}

Decoded Arguments:
Deployer/Owner: ${deployerAddress}
`;

    const argsPath = path.join(verificationDir, "testdai-constructor-args.txt");
    fs.writeFileSync(argsPath, argsContent);

    console.log("✅ Constructor arguments saved to:");
    console.log("   " + argsPath);

    // Create verification guide for TestDAI
    const guide = `# TestDAI Verification Guide

## Contract Information
- **Address:** 0xCC0DF0CD04526faB0B3d396456257D059f439548
- **Network:** Monad Testnet (Chain ID: 10143)
- **Compiler:** ${buildInfo.solcVersion}
- **Optimization:** Disabled (default profile)
- **EVM Version:** cancun

## Files Ready for Upload

### 1. Standard JSON Input
**File:** \`testdai-standard-json-input.json\`
- Contains all source code and compiler settings
- Language: Solidity ✅
- Ready to upload directly

### 2. Constructor Arguments
**File:** \`testdai-constructor-args.txt\`
- Deployer: ${deployerAddress}
- Encoded (without 0x): \`${encoded.slice(2)}\`

## Verification Steps

1. **Go to MonadVision:**
   https://monadvision.com/address/0xCC0DF0CD04526faB0B3d396456257D059f439548

2. **Find "Verify & Publish Contract"** or submit contract button

3. **Select:** "Solidity (Standard JSON Input)"

4. **Fill in the form:**
   - **Contract Name:** \`TestDAI\`
   - **Compiler Version:** \`v${buildInfo.solcVersion}\`
   - **Standard JSON Input:** Upload \`testdai-standard-json-input.json\`
   - **Constructor Arguments:** \`${encoded.slice(2)}\` (without 0x prefix)

5. **Submit verification**

## Important Notes

- Use the EXACT same format you used for SmartPortfolio
- The JSON already includes \`"language": "Solidity"\`
- Constructor args are WITHOUT the 0x prefix
- Compiler version must match exactly: v${buildInfo.solcVersion}

## Alternative: TestWETH

If you also want to verify TestWETH (0xb1F65f83C94Fe67EbA77299632e891C39c163Cf3):
- Use the same JSON file (it has all contracts)
- Same constructor args (same deployer address)
- Just change the contract name to \`TestWETH\`
`;

    const guidePath = path.join(verificationDir, "TESTDAI_VERIFICATION_GUIDE.md");
    fs.writeFileSync(guidePath, guide);

    console.log("✅ Verification guide saved to:");
    console.log("   " + guidePath);

    console.log("\n" + "═".repeat(60));
    console.log("✅ All files ready in: ./verification/");
    console.log("═".repeat(60));
    console.log("\n📋 Files created:");
    console.log("   • testdai-standard-json-input.json");
    console.log("   • testdai-constructor-args.txt");
    console.log("   • TESTDAI_VERIFICATION_GUIDE.md");

    console.log("\n🌐 Next Steps:");
    console.log("1. Go to: https://monadvision.com/address/0xCC0DF0CD04526faB0B3d396456257D059f439548");
    console.log("2. Upload: verification/testdai-standard-json-input.json");
    console.log("3. Paste constructor args from: verification/testdai-constructor-args.txt");
    console.log("   (WITHOUT the 0x prefix)");
    console.log("\n" + "═".repeat(60));
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
