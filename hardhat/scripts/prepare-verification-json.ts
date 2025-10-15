import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Fix for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
    console.log("📦 Preparing verification JSON from build info...\n");

    // Your exact build info file path
    const buildInfoPath = path.join(
        __dirname,
        "..",
        "ignition",
        "deployments",
        "chain-10143",
        "build-info",
        "solc-0_8_28-378b7dd7551cc80f566585da78d3cc90f633e656.json"
    );

    if (!fs.existsSync(buildInfoPath)) {
        throw new Error("Build info file not found at: " + buildInfoPath);
    }

    const buildInfo = JSON.parse(fs.readFileSync(buildInfoPath, "utf8"));

    // Extract the standard JSON input - this already has "language": "Solidity"
    const standardJsonInput = buildInfo.input;

    // Create verification directory
    const verificationDir = path.join(__dirname, "..", "verification");
    if (!fs.existsSync(verificationDir)) {
        fs.mkdirSync(verificationDir, { recursive: true });
    }

    // Save the standard JSON input
    const outputPath = path.join(verificationDir, "standard-json-input.json");
    fs.writeFileSync(outputPath, JSON.stringify(standardJsonInput, null, 2));

    console.log("✅ Standard JSON Input saved to:");
    console.log("   " + outputPath);

    // Encode constructor arguments
    const { encodeAbiParameters, parseAbiParameters } = await import("viem");
    const routerAddress = "0xfb8e1c3b833f9e67a71c859a132cf783b645e436";
    const ownerAddress = "0xde9c18df0C7bef1ea3CFB08D8701daA2b92Bec5b";

    const encoded = encodeAbiParameters(
        parseAbiParameters('address, address'),
        [routerAddress as `0x${string}`, ownerAddress as `0x${string}`]
    );

    const argsContent = `ABI-Encoded Constructor Arguments
═══════════════════════════════════════

Without 0x prefix (use this for verification):
${encoded.slice(2)}

With 0x prefix:
${encoded}

Decoded Arguments:
Router: ${routerAddress}
Owner:  ${ownerAddress}
`;

    const argsPath = path.join(verificationDir, "constructor-args.txt");
    fs.writeFileSync(argsPath, argsContent);

    console.log("✅ Constructor arguments saved to:");
    console.log("   " + argsPath);

    // Create verification guide
    const guide = `# SmartPortfolio Verification Guide

## Contract Information
- **Address:** 0x8a2f5094992835cc6c2c83e515fbda4270182fe9
- **Network:** Monad Testnet (Chain ID: 10143)
- **Compiler:** ${buildInfo.solcVersion}
- **Optimization:** Enabled (200 runs)
- **EVM Version:** cancun

## Files Ready for Upload

### 1. Standard JSON Input
**File:** \`standard-json-input.json\`
- Contains all source code and compiler settings
- Language: Solidity ✅
- Ready to upload directly

### 2. Constructor Arguments
**File:** \`constructor-args.txt\`
- Router: ${routerAddress}
- Owner: ${ownerAddress}
- Encoded (without 0x): \`${encoded.slice(2)}\`

## Verification Steps

1. **Go to Monad Explorer:**
   https://testnet.monadexplorer.com/address/0x8a2f5094992835cc6c2c83e515fbda4270182fe9

2. **Find "Verify & Publish Contract"** section

3. **Select:** "Solidity (Standard JSON Input)"

4. **Fill in the form:**
   - **Contract Name:** \`SmartPortfolio\`
   - **Compiler Version:** \`v${buildInfo.solcVersion}\`
   - **Standard JSON Input:** Upload \`standard-json-input.json\`
   - **Constructor Arguments:** \`${encoded.slice(2)}\` (without 0x prefix)

5. **Submit verification**

## Troubleshooting

If verification fails with "language: undefined":
- ✅ This is already fixed! The JSON includes \`"language": "Solidity"\`

If verification still fails:
- Wait 5-10 minutes after deployment
- Ensure exact compiler version matches
- Try removing/adding 0x prefix from constructor args
- Monad verification infrastructure may still be in development

## Alternative: Flattened Source

If JSON verification doesn't work, generate flattened source:
\`\`\`bash
npx hardhat flatten contracts/SmartPortfolio.sol > SmartPortfolio-flattened.sol
\`\`\`

Then use "Via flattened source code" option instead.
`;

    const guidePath = path.join(verificationDir, "VERIFICATION_GUIDE.md");
    fs.writeFileSync(guidePath, guide);

    console.log("✅ Verification guide saved to:");
    console.log("   " + guidePath);

    console.log("\n" + "═".repeat(60));
    console.log("✅ All files ready in: ./verification/");
    console.log("═".repeat(60));
    console.log("\n📋 Files created:");
    console.log("   • standard-json-input.json (has 'language': 'Solidity')");
    console.log("   • constructor-args.txt");
    console.log("   • VERIFICATION_GUIDE.md");

    console.log("\n🌐 Next Steps:");
    console.log("1. Go to: https://testnet.monadexplorer.com/address/0x8a2f5094992835cc6c2c83e515fbda4270182fe9");
    console.log("2. Upload: verification/standard-json-input.json");
    console.log("3. Paste constructor args from: verification/constructor-args.txt");
    console.log("\n" + "═".repeat(60));
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });