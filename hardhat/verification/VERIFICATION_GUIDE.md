# SmartPortfolio Verification Guide

## Contract Information
- **Address:** 0x8a2f5094992835cc6c2c83e515fbda4270182fe9
- **Network:** Monad Testnet (Chain ID: 10143)
- **Compiler:** 0.8.28
- **Optimization:** Enabled (200 runs)
- **EVM Version:** cancun

## Files Ready for Upload

### 1. Standard JSON Input
**File:** `standard-json-input.json`
- Contains all source code and compiler settings
- Language: Solidity ✅
- Ready to upload directly

### 2. Constructor Arguments
**File:** `constructor-args.txt`
- Router: 0xfb8e1c3b833f9e67a71c859a132cf783b645e436
- Owner: 0xde9c18df0C7bef1ea3CFB08D8701daA2b92Bec5b
- Encoded (without 0x): `000000000000000000000000fb8e1c3b833f9e67a71c859a132cf783b645e436000000000000000000000000de9c18df0c7bef1ea3cfb08d8701daa2b92bec5b`

## Verification Steps

1. **Go to Monad Explorer:**
   https://testnet.monadexplorer.com/address/0x8a2f5094992835cc6c2c83e515fbda4270182fe9

2. **Find "Verify & Publish Contract"** section

3. **Select:** "Solidity (Standard JSON Input)"

4. **Fill in the form:**
   - **Contract Name:** `SmartPortfolio`
   - **Compiler Version:** `v0.8.28`
   - **Standard JSON Input:** Upload `standard-json-input.json`
   - **Constructor Arguments:** `000000000000000000000000fb8e1c3b833f9e67a71c859a132cf783b645e436000000000000000000000000de9c18df0c7bef1ea3cfb08d8701daa2b92bec5b` (without 0x prefix)

5. **Submit verification**

## Troubleshooting

If verification fails with "language: undefined":
- ✅ This is already fixed! The JSON includes `"language": "Solidity"`

If verification still fails:
- Wait 5-10 minutes after deployment
- Ensure exact compiler version matches
- Try removing/adding 0x prefix from constructor args
- Monad verification infrastructure may still be in development

## Alternative: Flattened Source

If JSON verification doesn't work, generate flattened source:
```bash
npx hardhat flatten contracts/SmartPortfolio.sol > SmartPortfolio-flattened.sol
```

Then use "Via flattened source code" option instead.
