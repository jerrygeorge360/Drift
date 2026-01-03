# Multi-Chain Smart Account Support

This document describes the multi-chain support that has been added to the MetaSmartPort platform, enabling smart account creation on both Monad Testnet and Sepolia Testnet.

## Overview

The platform now supports:
- **Monad Testnet** (testnet might not work due to the testnet reset)
- **Sepolia Testnet**

## API Changes

### Creating Smart Accounts

When creating a smart account, you can now specify the target chain:

```bash
POST /api/smart-accounts
Content-Type: application/json
Authorization: Bearer <your-token>

{
  "chainId": "sepolia",  // "monad" or "sepolia"
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



## Implementation Details

### Current Architecture

The platform currently implements multi-chain support with the following approach:

- **Chain Selection**: Users can specify `chainId` ("monad" or "sepolia") when creating smart accounts
- **Contract Integration**: Direct integration with deployed contracts (PortfolioFactory, tokens, DEX)
- **MetaMask Smart Accounts**: Configuration files exist but are not currently utilized
- **Backward Compatibility**: Full compatibility with existing Monad-based functionality