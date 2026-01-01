# Multi-Chain Smart Account Support

This document describes the multi-chain support that has been added to the MetaSmartPort platform, enabling smart account creation on both Monad Testnet and Sepolia Testnet.

## Overview

The platform now supports:
- **Monad Testnet** (default, existing functionality)
- **Sepolia Testnet** (newly added)

## API Changes

### Creating Smart Accounts

When creating a smart account, you can now specify the target chain:

```bash
POST /api/smart-accounts
Content-Type: application/json
Authorization: Bearer <your-token>

{
  "chainId": "sepolia",  // "monad" (default) or "sepolia"
  "autoDeploy": true     // optional
}
```

If no `chainId` is provided, it defaults to "monad" for backward compatibility.

### Getting Supported Chains

Get a list of all supported chains:

```bash
GET /api/smart-accounts/chains

Response:
{
  "supportedChains": [
    {
      "id": "monad",
      "name": "Monad Testnet",
      "chainId": 10143
    },
    {
      "id": "sepolia",
      "name": "Sepolia Testnet", 
      "chainId": 11155111
    }
  ],
  "defaultChain": "monad"
}
```

## Configuration

### Chain Configuration Files

- **Monad Testnet**: `src/config/metamask_monadtestnet_config.ts`
- **Sepolia Testnet**: `src/config/metamask_sepolia_config.ts` (newly created)
- **Chain Management**: `src/config/chainConfig.ts` (newly created)

### Sepolia Contract Addresses

The following contracts are already deployed on Sepolia testnet:

#### Token Contracts
- **Test DAI**: `0xAd22b4EC8cdd8A803d0052632566F6334A04F1F3`
- **Test USDC**: `0xcF9884827F587Cd9a0bDce33995B2333eE7e8285`
- **Test USDT**: `0x1861BB06286aAb0fDA903620844b4Aef4894b719`
- **Test WBTC**: `0x4267652AF61B4bE50A39e700ee2a160f42371f54`

#### Portfolio Management
- **PortfolioFactory**: `0x49C17A91672c629543a14782809E246296317bA3`

#### DEX Infrastructure (Existing Sepolia Uniswap V2)
- **UniswapV2Factory**: `0xF62c03E08ada871A0bEb309762E260a7a6a880E6`
- **UniswapV2Router02**: `0xeE567Fe1712Faf6149d80dA1E6934E354124CfE3`

#### ERC-4337 Infrastructure
- **EntryPoint**: `0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789` (Standard ERC-4337 EntryPoint)

> **Note**: The MetaMask Smart Accounts Kit configuration (`metamask_sepolia_config.ts`) is currently not being used. The platform uses the above contracts directly for portfolio management and token operations.

### Environment Variables

Make sure these environment variables are properly configured for both chains:

```env
PIMLICO_API_URL=<your-pimlico-url>
# Add Sepolia-specific URLs if different from Monad
```

## Implementation Details

### Current Architecture

The platform currently implements multi-chain support with the following approach:

- **Chain Selection**: Users can specify `chainId` ("monad" or "sepolia") when creating smart accounts
- **Contract Integration**: Direct integration with deployed contracts (PortfolioFactory, tokens, DEX)
- **MetaMask Smart Accounts**: Configuration files exist but are not currently utilized
- **Backward Compatibility**: Full compatibility with existing Monad-based functionality

### New Files Created

1. **`src/config/metamask_sepolia_config.ts`** - Sepolia chain configuration (for future use)
2. **`src/config/chainConfig.ts`** - Chain management utilities

### Modified Files

1. **`src/controllers/smartAccountController.ts`** - Added chain selection support
2. **`src/controllers/clients.ts`** - Added multi-chain client creation
3. **`src/routes/smartAccountRoute.ts`** - Added supported chains endpoint

### Key Features

- **Backward Compatibility**: Existing API calls without `chainId` continue to work with Monad
- **Chain Validation**: Invalid chain IDs are rejected with clear error messages
- **Dynamic Configuration**: Chain environments are initialized on-demand
- **Type Safety**: Full TypeScript support with proper type definitions

## Example Usage

```typescript
// Create smart account on Sepolia
const response = await fetch('/api/smart-accounts', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    chainId: 'sepolia',
    autoDeploy: true
  })
});

// Create smart account on Monad (default)
const response2 = await fetch('/api/smart-accounts', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    autoDeploy: true
  })
});
```

## Next Steps

1. ✅ **Sepolia contracts are already deployed** - All necessary token, portfolio, and DEX contracts are available
2. **Test smart account creation** on Sepolia testnet using the new API endpoints
3. **Test portfolio operations** with the deployed PortfolioFactory contract
4. **Consider adding more chains** by creating similar configuration files
5. **Optimize MetaMask configuration** if smart account features are needed in the future

> **Current Status**: Sepolia support is ready for use with existing contract infrastructure. The MetaMask Smart Accounts Kit configuration is available but not currently utilized by the platform.
