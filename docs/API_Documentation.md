# MetaSmartPort API Documentation

## Overview

MetaSmartPort is a decentralized portfolio management platform that enables users to create smart accounts, manage portfolios, and delegate trading permissions to automated bots. The API provides comprehensive functionality for portfolio creation, delegation management, and blockchain operations.

**Base URL:** `https://api-domain.com/api`

## Table of Contents

1. [Authentication & User Management](#authentication--user-management)
2. [Smart Accounts](#smart-accounts)
3. [Delegations](#delegations)
4. [Portfolio Management](#portfolio-management)
5. [Tokens & Allocations](#tokens--allocations)
6. [Rebalancing](#rebalancing)
7. [Dashboard & Real-time Data](#dashboard--real-time-data)
8. [SSE (Server-Sent Events)](#sse-server-sent-events)
9. [Bot Management (Admin)](#bot-management-admin)
10. [Contract Configuration (Admin)](#contract-configuration-admin)
11. [Oracle & Price Data (Admin)](#oracle--price-data-admin)
12. [Blockchain Operations](#blockchain-operations)
13. [Webhooks](#webhooks)

## Authentication

The API uses JWT-based authentication with Sign-In With Ethereum (SIWE) for user login.

### Authentication Flow

1. Get a nonce for SIWE
2. Sign the message with user's wallet
3. Submit the signed message to receive a JWT token
4. Include the JWT token in the Authorization header for subsequent requests

### Headers

All authenticated requests require:

```http
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

### User Roles

- **user**: Can manage own portfolios, delegations, and allocations
- **admin**: Full system access including bot management, token administration, and contract configuration
- **bot**: Special role for automated trading operations

---

## Authentication & User Management

### Get SIWE Nonce

Retrieve a nonce for Sign-In With Ethereum authentication.

**Endpoint:** `GET /login/nonce`

**Response:**
```json
{
  "nonce": "string"
}
```

---

### SIWE Login

Authenticate user with signed Ethereum message.

**Endpoint:** `POST /login`

**Request Body:**
```json
{
  "message": "string",
  "signature": "string",
  "address": "string"
}
```

**Response:**
```json
{
  "token": "string",
  "user": {
    "id": "string",
    "address": "string",
    "role": "string"
  }
}
```

---

### List Users

Get all users in the system.

**Endpoint:** `GET /users`
**Authorization:** Admin required

**Response:**
```json
{
  "users": [
    {
      "id": "string",
      "address": "string",
      "role": "string",
      "createdAt": "string",
      "updatedAt": "string"
    }
  ]
}
```

---

### Get User by ID

Retrieve a specific user's information.

**Endpoint:** `GET /users/:id`
**Authorization:** Required

**Response:**
```json
{
  "id": "string",
  "address": "string",
  "role": "string",
  "createdAt": "string",
  "updatedAt": "string"
}
```

---

### Delete User

Remove a user from the system.

**Endpoint:** `DELETE /users/:id`
**Authorization:** Required

**Response:**
```json
{
  "message": "User deleted successfully"
}
```

---

## Smart Accounts

### Get Supported Chains

Get list of supported blockchain networks.

**Endpoint:** `GET /smartAccounts/chains`
**Authorization:** Required

**Response:**
```json
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

---

### Create Smart Account

Deploy a new smart account for the authenticated user.

**Endpoint:** `POST /smartAccounts`
**Authorization:** Required

**Request Body:**
```json
{
  "portfolioName": "string",
  "autoDeploy": "boolean"
}
```

**Response:**
```json
{
  "message": "Smart account created successfully",
  "account": {
    "id": "string",
    "userId": "string",
    "address": "string",
    "ownerAddress": "string",
    "deployed": "boolean",
    "createdAt": "string",
    "portfolio": {
      "id": "string",
      "name": "string"
    }
  },
  "deployment": {
    "deployed": "boolean",
    "transactionHash": "string"
  }
}
```

---

### Get User's Smart Accounts

Retrieve all smart accounts for the authenticated user.

**Endpoint:** `GET /smartAccounts`
**Authorization:** Required

**Response:**
```json
{
  "smartAccounts": [
    {
      "id": "string",
      "address": "string",
      "ownerAddress": "string",
      "deployed": "boolean",
      "createdAt": "string",
      "portfolio": {
        "id": "string",
        "name": "string"
      }
    }
  ]
}
```

---

### Get Smart Account by ID

Get details of a specific smart account.

**Endpoint:** `GET /smartAccounts/:id`
**Authorization:** Required

**Response:**
```json
{
  "smartAccount": {
    "id": "string",
    "address": "string",
    "ownerAddress": "string",
    "deployed": "boolean",
    "createdAt": "string"
  }
}
```

---

### Delete Smart Account

Remove a smart account.

**Endpoint:** `DELETE /smartAccounts/:id`
**Authorization:** Required

**Response:**
```json
{
  "message": "Smart account deleted successfully"
}
```

---

## Delegations

### Create Delegation

Create a new delegation for a smart account.

**Endpoint:** `POST /delegations/:smartAccountId`
**Authorization:** User required

**Response:**
```json
{
  "delegation": {
    "id": "string",
    "smartAccountId": "string",
    "delegatorAddress": "string",
    "delegateAddress": "string",
    "expiresAt": "string",
    "signature": "object",
    "createdAt": "string"
  }
}
```

---

### Check Delegation Status

Check if a smart account has an active delegation.

**Endpoint:** `GET /delegations/:smartAccountId/check`
**Authorization:** Not required

**Response:**
```json
{
  "success": true,
  "data": {
    "hasDelegation": "boolean",
    "delegationExists": "boolean", 
    "isRevoked": "boolean",
    "isExpired": "boolean"
  }
}
```

---

### Revoke Delegation

Revoke an existing delegation.

**Endpoint:** `PUT /delegations/:delegationId/revoke`
**Authorization:** User required

**Response:**
```json
{
  "message": "Delegation revoked successfully"
}
```

---

### Redeem Delegation

Redeem a delegation for bot operations.

**Endpoint:** `POST /delegations/:smartAccountId/redeem/:delegationId`
**Authorization:** Bot role required

**Response:**
```json
{
  "success": true,
  "data": {
    "redeemed": "boolean",
    "transactionHash": "string"
  }
}
```

---

## Rebalancing

### Create Rebalance Log

Create a new rebalance log entry.

**Endpoint:** `POST /rebalance`

**Request Body:**
```json
{
  "portfolioId": "string",
  "tokenInId": "string", 
  "tokenOutId": "string",
  "amountIn": "number",
  "amountOut": "number",
  "reason": "string",
  "executor": "string"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "string",
    "portfolioId": "string",
    "tokenInId": "string",
    "tokenOutId": "string",
    "amountIn": "number",
    "amountOut": "number",
    "reason": "string",
    "executor": "string",
    "createdAt": "string"
  }
}
```

---

### Get Rebalance Analytics

Get comprehensive rebalance analytics and performance metrics.

**Endpoint:** `GET /rebalance/analytics`

**Query Parameters:**
- `portfolioId` (optional): Filter by specific portfolio
- `timeframe` (optional): `7d`, `30d` (default), `90d`

**Response:**
```json
{
  "success": true,
  "data": {
    "summary": {
      "totalRebalances": "number",
      "successRate": "number",
      "averageDrift": "number",
      "totalGasCost": "string",
      "averageGasCost": "string"
    },
    "trends": [
      {
        "date": "string",
        "rebalanceCount": "number",
        "averageDrift": "number",
        "totalGasCost": "string"
      }
    ],
    "portfolioPerformance": [
      {
        "portfolioId": "string",
        "rebalanceCount": "number",
        "successRate": "number",
        "averageDrift": "number",
        "totalGasCost": "string"
      }
    ]
  }
}
```

---

### Get Rebalance Logs

Get rebalance logs for a specific portfolio.

**Endpoint:** `GET /rebalance/:portfolioId`

**Response:**
```json
{
  "success": true,
  "count": "number",
  "data": [
    {
      "id": "string",
      "portfolioId": "string",
      "tokenInId": "string",
      "tokenOutId": "string",
      "amountIn": "number",
      "amountOut": "number",
      "reason": "string",
      "executor": "string",
      "driftPercentage": "number",
      "gasUsed": "string",
      "status": "string",
      "transactionHash": "string",
      "createdAt": "string"
    }
  ]
}
```

---

## Dashboard & Real-time Data

### Get Portfolio Dashboard Data

Get comprehensive dashboard data for a portfolio.

**Endpoint:** `GET /dashboard/portfolio/:portfolioId/dashboard`
**Authorization:** Required

**Response:**
```json
{
  "success": true,
  "data": {
    "portfolio": {
      "id": "string",
      "name": "string",
      "totalValueUSD": "number",
      "allocations": [
        {
          "token": {
            "symbol": "string",
            "name": "string"
          },
          "percent": "number",
          "amount": "number",
          "valueUSD": "number"
        }
      ]
    },
    "performance": {
      "drift": "number",
      "lastRebalance": "string",
      "totalRebalances": "number"
    },
    "timestamp": "string"
  }
}
```

---

### Dashboard Real-time Stream

Server-Sent Events endpoint for real-time dashboard updates.

**Endpoint:** `GET /dashboard/portfolio/:portfolioId/dashboard/stream`
**Authorization:** Required

**Event Types:**
- `connected`: Initial connection confirmation
- `dashboard-data`: Initial portfolio data
- `dashboard-update`: Periodic updates (every 30s)
- `rebalance-update`: Immediate updates after rebalancing
- `heartbeat`: Keep-alive signal (every 30s)
- `error`: Error notifications

**Example Usage:**
```javascript
const eventSource = new EventSource('/api/dashboard/portfolio/{portfolioId}/dashboard/stream', {
  headers: {
    'Authorization': 'Bearer your-token'
  }
});

eventSource.addEventListener('dashboard-data', (event) => {
  const data = JSON.parse(event.data);
  console.log('Dashboard data:', data);
});
```

## SSE (Server-Sent Events)

### Analysis Stream

Connect to real-time analysis updates.

**Endpoint:** `GET /sse/analysis`
**Authorization:** Required

**Event Types:**
- `analysis`: New analysis data
- `heartbeat`: Keep-alive signal
- `error`: Error notifications

**Example Usage:**
```javascript
const eventSource = new EventSource('/api/sse/analysis', {
  headers: {
    'Authorization': 'Bearer your-token'
  }
});

eventSource.addEventListener('analysis', (event) => {
  const data = JSON.parse(event.data);
  console.log('Analysis update:', data);
});
```

---

### Test Analysis Insert

Insert test analysis data to trigger SSE events.

**Endpoint:** `POST /sse/test-analysis`
**Authorization:** Required

**Request Body:**
```json
{
  "text": "string"
}
```

**Response:**
```json
{
  "success": true,
  "analysis": {
    "id": "string",
    "text": "string",
    "createdAt": "string"
  }
}
```

---

## Portfolio Management

### Create Portfolio

Create a new portfolio for a smart account.

**Endpoint:** `POST /portfolio`
**Authorization:** User role required

**Request Body:**
```json
{
  "smartAccountId": "string",
  "name": "string"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Portfolio created successfully",
  "data": {
    "id": "string",
    "smartAccountId": "string",
    "name": "string",
    "portfolioAddress": "string | null",
    "createdAt": "string"
  }
}
```

---

### Get Portfolio

Retrieve portfolio information by smart account ID.

**Endpoint:** `GET /portfolio/:smartAccountId`
**Authorization:** User role required

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "string",
    "smartAccountId": "string", 
    "name": "string",
    "portfolioAddress": "string | null",
    "allocations": [
      {
        "id": "string",
        "tokenId": "string",
        "percent": "number",
        "amount": "number",
        "token": {
          "symbol": "string",
          "name": "string",
          "address": "string"
        }
      }
    ]
  }
}
```

---

### Update Portfolio Name

Update the name of a portfolio.

**Endpoint:** `PUT /portfolio/:smartAccountId`
**Authorization:** User role required

**Request Body:**
```json
{
  "newName": "string"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Portfolio name updated successfully",
  "data": {
    "id": "string", 
    "name": "string"
  }
}
```

---

## Tokens & Allocations

### Get All Tokens

Retrieve all tokens in the system.

**Endpoint:** `GET /tokens`

**Response:**
```json
{
  "tokens": [
    {
      "id": "string",
      "symbol": "string",
      "name": "string",
      "address": "string",
      "decimals": "number",
      "createdAt": "string"
    }
  ]
}
```

---

### Get Token by Symbol

Retrieve a token by its symbol.

**Endpoint:** `GET /tokens/symbol/:symbol`

**Response:**
```json
{
  "id": "string",
  "symbol": "string",
  "name": "string", 
  "address": "string",
  "decimals": "number"
}
```

---

### Get Portfolio Allocations

Retrieve all allocations for a specific portfolio.

**Endpoint:** `GET /allocations/:portfolioId`
**Authorization:** User role required

**Response:**
```json
{
  "allocations": [
    {
      "id": "string",
      "portfolioId": "string",
      "tokenId": "string", 
      "percent": "number",
      "amount": "number",
      "token": {
        "symbol": "string",
        "name": "string",
        "address": "string",
        "decimals": "number"
      }
    }
  ]
}
```

---

### Set Portfolio Allocations

Set new allocations for a portfolio (replaces existing allocations).

**Endpoint:** `POST /allocations/:portfolioId`
**Authorization:** User role required

**Request Body:**
```json
{
  "allocations": [
    {
      "tokenId": "string",
      "percent": "number"
    }
  ]
}
```

**Response:**
```json
{
  "message": "Allocations updated successfully",
  "allocations": []
}
```

---

### Delete Allocation

Remove a specific token allocation from a portfolio.

**Endpoint:** `DELETE /allocations/:portfolioId/:tokenId`
**Authorization:** User role required

**Response:**
```json
{
  "message": "Allocation deleted successfully"
}
```

---

## Bot Management (Admin)

### Create Bot

Register a new trading bot.

**Endpoint:** `POST /bot`
**Authorization:** Admin required

**Request Body:**
```json
{
  "name": "string",
  "description": "string",
  "privateKey": "string"
}
```

**Response:**
```json
{
  "id": "string",
  "name": "string",
  "address": "string",
  "description": "string",
  "status": "string",
  "createdAt": "string"
}
```

---

### Get All Bots

Retrieve all registered bots.

**Endpoint:** `GET /bot`
**Authorization:** Admin required

**Response:**
```json
{
  "bots": [
    {
      "id": "string",
      "name": "string",
      "address": "string", 
      "description": "string",
      "status": "string",
      "lastRunAt": "string | null"
    }
  ]
}
```

---

### Get Bot by ID

Retrieve a specific bot's information.

**Endpoint:** `GET /bot/:id`
**Authorization:** Admin required

**Response:**
```json
{
  "id": "string",
  "name": "string",
  "address": "string",
  "description": "string",
  "status": "string",
  "lastRunAt": "string | null"
}
```

---

### Delete Bot

Remove a bot from the system.

**Endpoint:** `DELETE /bot/:id`
**Authorization:** Admin required

**Response:**
```json
{
  "message": "Bot deleted successfully"
}
```

---

## Contract Configuration (Admin)

### Create or Update Contract Config

Create or update smart contract configuration.

**Endpoint:** `POST /contract`
**Authorization:** Admin required

**Request Body:**
```json
{
  "contractAddress": "string",
  "network": "string",
  "owner": "string",
  "paused": "boolean",
  "name": "string"
}
```

**Response:**
```json
{
  "id": "string",
  "contractAddress": "string",
  "network": "string",
  "owner": "string",
  "paused": "boolean",
  "name": "string",
  "updatedAt": "string"
}
```

---

### Get Contract Config by Address

Retrieve contract configuration by address.

**Endpoint:** `GET /contract/:address`
**Authorization:** Admin required

**Response:**
```json
{
  "id": "string",
  "contractAddress": "string",
  "network": "string", 
  "owner": "string",
  "paused": "boolean",
  "name": "string"
}
```

---

### Get All Contract Configs

Retrieve all contract configurations.

**Endpoint:** `GET /contract`
**Authorization:** Admin required

**Query Parameters:**
- `network` (optional): Filter by network

**Response:**
```json
{
  "contracts": [
    {
      "id": "string",
      "contractAddress": "string",
      "network": "string",
      "owner": "string",
      "paused": "boolean",
      "name": "string"
    }
  ]
}
```

---

### Update Contract Pause Status

Update the pause status of a contract.

**Endpoint:** `PUT /contract/:id/pause`
**Authorization:** Admin required

**Request Body:**
```json
{
  "paused": "boolean"
}
```

**Response:**
```json
{
  "message": "Contract pause status updated successfully"
}
```

---

### Delete Contract Config

Remove a contract configuration.

**Endpoint:** `DELETE /contract/:id`
**Authorization:** Admin required

**Response:**
```json
{
  "message": "Contract configuration deleted successfully"
}
```

---

## Oracle & Price Data (Admin)

### Start Price Polling

Start automated price data collection.

**Endpoint:** `POST /admin/price-polling/start`
**Authorization:** Admin required

**Response:**
```json
{
  "message": "Price polling started successfully",
  "status": "running"
}
```

---

### Stop Price Polling

Stop automated price data collection.

**Endpoint:** `POST /admin/price-polling/stop`
**Authorization:** Admin required

**Response:**
```json
{
  "message": "Price polling stopped successfully", 
  "status": "stopped"
}
```

---

### Get Price Polling Status

Check the status of price polling.

**Endpoint:** `GET /admin/price-polling/status`
**Authorization:** Admin required

**Response:**
```json
{
  "status": "running | stopped",
  "lastUpdate": "string",
  "interval": "number"
}
```

---

## Blockchain Operations

### Get Portfolio On-Chain Balance

Get the on-chain balance for a portfolio.

**Endpoint:** `GET /blockchain/portfolio/:portfolioAddress/balance/:tokenAddress`

**Response:**
```json
{
  "balance": "string",
  "formatted": "string",
  "decimals": "number"
}
```

---

### Execute Swap

Execute a token swap on-chain.

**Endpoint:** `POST /blockchain/swap`

**Request Body:**
```json
{
  "portfolioAddress": "string",
  "tokenIn": "string",
  "tokenOut": "string", 
  "amountIn": "string",
  "minAmountOut": "string"
}
```

**Response:**
```json
{
  "success": "boolean",
  "transactionHash": "string",
  "gasUsed": "string"
}
```

---

### Get Portfolio Allocation

Get current on-chain allocation for a portfolio.

**Endpoint:** `GET /blockchain/portfolio/:portfolioAddress/allocation`

**Response:**
```json
{
  "allocations": [
    {
      "token": "string",
      "balance": "string",
      "percentage": "number"
    }
  ],
  "totalValue": "string"
}
```

---

### Get Token Price

Get the current price of a token.

**Endpoint:** `GET /blockchain/price/:tokenAddress`

**Response:**
```json
{
  "price": "string", 
  "priceUsd": "number",
  "lastUpdated": "string"
}
```

---

## Webhooks

### User Agent Webhook

Webhook endpoint for external integrations.

**Endpoint:** `POST /webhook`
**Authorization:** Webhook authentication required

**Request Body:**
```json
{
  "event": "string",
  "data": "object"
}
```

**Response:**
```json
{
  "success": "boolean",
  "message": "string"
}
```

---

## Error Handling

The API uses standard HTTP status codes and returns error responses in the following format:

```json
{
  "success": false,
  "error": "string",
  "message": "string"
}
```

### Common Status Codes

- `200 OK`: Request successful
- `201 Created`: Resource created successfully
- `400 Bad Request`: Invalid request parameters
- `401 Unauthorized`: Authentication required or invalid
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Resource not found
- `500 Internal Server Error`: Server error

### Authentication Errors

```json
{
  "message": "Unauthorized: User info missing"
}
```

### Validation Errors

```json
{
  "error": "Field validation error",
  "message": "Specific validation message"
}
```

---

## Rate Limiting

The API implements rate limiting to ensure service stability. Limits vary by endpoint:

- **Authentication endpoints**: 10 requests per minute
- **Data retrieval**: 100 requests per minute  
- **Data modification**: 50 requests per minute
- **Admin operations**: 20 requests per minute

Rate limit headers are included in responses:

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 99
X-RateLimit-Reset: 1640995200
```

---

## WebSocket & Real-time Features

### Server-Sent Events (SSE)

The API provides real-time updates through SSE endpoints:

1. **Dashboard Stream**: `/dashboard/portfolio/:portfolioId/dashboard/stream`
2. **Analysis Stream**: `/sse/analysis`

### Connection Management

- Automatic reconnection on connection loss
- Heartbeat messages to maintain connection
- Error handling for network issues
- Connection limits per user (max 5 concurrent)

---

## SDK Examples

### JavaScript/TypeScript

```typescript
// Initialize API client
const api = new MetaSmartPortAPI({
  baseURL: 'https://api.metasmartport.com/api',
  authToken: 'your-jwt-token'
});

// Create smart account
const account = await api.smartAccounts.create({
  portfolioName: 'My Portfolio',
  autoDeploy: true
});

// Set portfolio allocations
await api.allocations.set(portfolioId, [
  { tokenId: 'token1', percent: 60 },
  { tokenId: 'token2', percent: 40 }
]);

// Connect to real-time dashboard
const stream = api.dashboard.stream(portfolioId);
stream.on('dashboard-update', (data) => {
  console.log('Portfolio updated:', data);
});
```

---

## Conclusion

This API documentation covers all endpoints available in the MetaSmartPort platform. For additional support or questions, please refer to the technical documentation or contact the development team.

### Get Bot by ID

Retrieve a specific bot's information.

**Endpoint:** `GET /bot/:id`
**Authorization:** Admin required

**Response:**
```json
{
  "id": "string",
  "name": "string",
  "address": "string",
  "description": "string",
  "status": "string",
  "lastRunAt": "string | null"
}
```

---

### Update Bot

Update bot information.

**Endpoint:** `PATCH /bot/:id`
**Authorization:** Admin required

**Request Body:**
```json
{
  "name": "string",
  "description": "string",
  "status": "string"
}
```

---

### Delete Bot

Remove a bot from the system.

**Endpoint:** `DELETE /bot/:id`
**Authorization:** Admin required

---

## Blockchain Operations

### Get User Allocation

Retrieve a user's portfolio allocation from the blockchain.

**Endpoint:** `GET /blockchain/allocation/:userAddress`

**Response:**
```json
{
  "userAddress": "string",
  "allocations": [
    {
      "token": "string",
      "percent": "number",
      "amount": "string"
    }
  ]
}
```

---

### Check Has Allocation

Check if a user has any portfolio allocations.

**Endpoint:** `GET /blockchain/has-allocation/:userAddress`

**Response:**
```json
{
  "userAddress": "string",
  "hasAllocation": "boolean"
}
```

---

### Estimate Swap

Get estimated output for a token swap.

**Endpoint:** `POST /blockchain/estimate-swap`

**Request Body:**
```json
{
  "tokenIn": "string",
  "tokenOut": "string",
  "amountIn": "string",
  "path": ["string"]
}
```

**Response:**
```json
{
  "amountOut": "string",
  "priceImpact": "string",
  "path": ["string"]
}
```

---

### Get Contract Status

Retrieve the current status of smart contracts.

**Endpoint:** `GET /blockchain/status`

**Response:**
```json
{
  "paused": "boolean",
  "owner": "string",
  "router": "string"
}
```

---

## System Management

### Contract Configuration

#### Create Contract Configuration

**Endpoint:** `POST /contract`
**Authorization:** Admin required

**Request Body:**
```json
{
  "name": "string",
  "contractAddress": "string",
  "network": "string",
  "owner": "string"
}
```

---

#### Get All Contract Configurations

**Endpoint:** `GET /contract`
**Authorization:** Admin required

---

#### Get Configuration by Address

**Endpoint:** `GET /contract/:address`
**Authorization:** Admin required

---

#### Toggle Contract Pause

**Endpoint:** `PATCH /contract/:address/pause`
**Authorization:** Admin required

---

#### Delete Contract Configuration

**Endpoint:** `DELETE /contract/:address`
**Authorization:** Admin required

---

### Rebalance Logs

#### Create Rebalance Log

**Endpoint:** `POST /rebalance`

**Request Body:**
```json
{
  "portfolioId": "string",
  "tokenInId": "string",
  "tokenOutId": "string",
  "amountIn": "number",
  "amountOut": "number",
  "reason": "string",
  "executor": "string"
}
```

---

#### Get Rebalance Logs

Retrieve historical rebalancing logs for analysis and monitoring.

**Endpoint:** `GET /rebalance/logs`
**Authorization:** User role required (admins see all, users see own)

**Query Parameters:**
- `portfolioId`: Filter by specific portfolio
- `status`: Filter by status (SUCCESS, FAILED, PENDING)
- `limit`: Number of records to return (default: 50)
- `offset`: Skip number of records for pagination

**Response:**
```json
{
  "logs": [
    {
      "id": "string",
      "portfolioId": "string",
      "timestamp": "string",
      "status": "SUCCESS|FAILED|PENDING",
      "transactionHash": "string",
      "gasUsed": "string",
      "gasCost": "string",
      "driftPercentage": "number",
      "tokenAmounts": "string",
      "swapPath": "string",
      "errorMessage": "string",
      "executionTime": "number",
      "portfolio": {
        "id": "string",
        "smartAccount": {
          "address": "string"
        }
      }
    }
  ],
  "pagination": {
    "total": "number",
    "page": "number", 
    "limit": "number",
    "hasNext": "boolean"
  }
}
```

---

#### Get Rebalance Analytics

Get analytics and performance metrics for rebalancing activities.

**Endpoint:** `GET /rebalance/analytics`
**Authorization:** User role required

**Query Parameters:**
- `portfolioId`: Specific portfolio (optional)
- `timeframe`: `7d`, `30d`, `90d` (default: 30d)

**Response:**
```json
{
  "summary": {
    "totalRebalances": "number",
    "successRate": "number",
    "averageDrift": "number",
    "totalGasCost": "string",
    "averageGasCost": "string",
    "averageExecutionTime": "number"
  },
  "trends": [
    {
      "date": "string",
      "rebalanceCount": "number",
      "averageDrift": "number",
      "totalGasCost": "string"
    }
  ],
  "portfolioPerformance": [
    {
      "portfolioId": "string",
      "rebalanceCount": "number",
      "successRate": "number", 
      "averageDrift": "number",
      "totalGasCost": "string"
    }
  ]
}
```

---

## AI Analysis System

### Get Latest Analysis

Retrieve the most recent AI market analysis.

**Endpoint:** `GET /analysis/latest`

**Response:**
```json
{
  "analysis": {
    "id": "string",
    "content": "string",
    "createdAt": "string",
    "summary": "string",
    "keyInsights": ["string"]
  }
}
```

---

### Get Analysis History

Retrieve historical AI analyses with pagination.

**Endpoint:** `GET /analysis/history`

**Query Parameters:**
- `limit`: Number of analyses to return (default: 10)
- `offset`: Skip number of records

**Response:**
```json
{
  "analyses": [
    {
      "id": "string",
      "content": "string",
      "createdAt": "string",
      "summary": "string"
    }
  ],
  "pagination": {
    "total": "number",
    "hasNext": "boolean"
  }
}
```

---

### Get AI Memory Context

Retrieve AI memory summaries that provide context for analysis.

**Endpoint:** `GET /analysis/memory`

**Query Parameters:**
- `limit`: Number of memory entries (default: 5)

**Response:**
```json
{
  "memories": [
    {
      "id": "string",
      "summary": "string", 
      "createdAt": "string"
    }
  ]
}
```

---

### Server-Sent Events (SSE)

Real-time updates for analysis and rebalancing events.

**Endpoint:** `GET /sse`

**Event Types:**
- `new_analysis`: New AI analysis available
- `rebalance_complete`: Portfolio rebalancing completed
- `rebalance_failed`: Portfolio rebalancing failed
- `price_update`: New market price data

**Note:** For real-time portfolio dashboard updates, use the dedicated dashboard SSE endpoint documented in the Dashboard section: `/dashboard/portfolio/:portfolioId/dashboard/stream`

**Example Events:**
```javascript
// New Analysis Event
{
  "type": "new_analysis",
  "data": {
    "analysisId": "string",
    "timestamp": "string",
    "summary": "string",
    "keyInsights": ["string"]
  }
}

// Rebalance Complete Event
{
  "type": "rebalance_complete",
  "data": {
    "portfolioId": "string",
    "transactionHash": "string",
    "driftPercentage": "number",
    "gasUsed": "string", 
    "timestamp": "string"
  }
}
```

---

## Error Responses

The API returns standard HTTP status codes and error messages in JSON format.

### Common Error Codes

- `400` - Bad Request: Invalid input data
- `401` - Unauthorized: Missing or invalid authentication
- `403` - Forbidden: Insufficient permissions
- `404` - Not Found: Resource not found
- `500` - Internal Server Error: Server error

### Error Response Format

```json
{
  "error": "string",
  "message": "string",
  "details": "string"
}
```

---

## Environment Variables

Required environment variables for testing:

- `baseURL` - API base URL
- `authToken` - JWT authentication token  
- `smartAccountId` - User's smart account ID
- `portfolioId` - Portfolio ID for testing

---

## Complete User Journey

### Typical Workflow

1. **Authentication**
   - GET `/login/nonce`
   - POST `/login` with signed message

2. **Setup**
   - POST `/smartAccounts` to create smart account
   - POST `/portfolio` to create portfolio
   - POST `/portfolio/deploy` to deploy on-chain

3. **Configuration**
   - POST `/allocations/:portfolioId` to set allocations

4. **Delegation**
   - POST `/delegations/:smartAccountId` to enable bot trading

5. **Monitoring**
   - GET `/rebalance/:portfolioId` to view trade history
