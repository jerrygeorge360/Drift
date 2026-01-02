# MetaSmartPort API Documentation

## Overview

MetaSmartPort is a decentralized portfolio management platform that enables users to create smart accounts, manage portfolios, and delegate trading permissions to automated bots. The API provides comprehensive functionality for portfolio creation, delegation management, and blockchain operations.

**Base URL:** `https://your-api-domain.com/api`

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

## Smart Account Management

### Create Smart Account

Deploy a new smart account for the authenticated user.

**Endpoint:** `POST /smartAccounts`
**Authorization:** Required

**Request Body:**
```json
{
  "name": "string",
  "chainId": "string", // "monad" (default) or "sepolia"
  "autoDeploy": "boolean"
}
```

**Response:**
```json
{
  "id": "string",
  "address": "string",
  "name": "string",
  "ownerAddress": "string",
  "userId": "string",
  "createdAt": "string"
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
      "name": "string",
      "ownerAddress": "string",
      "deployed": "boolean",
      "createdAt": "string"
    }
  ]
}
```

---

### Get Smart Account by ID

Retrieve a specific smart account.

**Endpoint:** `GET /smartAccounts/:id`
**Authorization:** Required

**Response:**
```json
{
  "id": "string",
  "address": "string",
  "name": "string",
  "ownerAddress": "string",
  "deployed": "boolean",
  "createdAt": "string"
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
    "deploymentRequired": "boolean",
    "createdAt": "string"
  }
}
```

---

### Deploy Portfolio On-Chain

Deploy the portfolio contract via the Portfolio Factory.

**Endpoint:** `POST /portfolio/deploy`
**Authorization:** User role required

**Request Body:**
```json
{
  "smartAccountId": "string"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Portfolio deployed successfully",
  "data": {
    "portfolio": {
      "id": "string",
      "portfolioAddress": "string"
    },
    "deploymentInfo": {
      "portfolioAddress": "string",
      "transactionHash": "string",
      "userOpHash": "string"
    }
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
    ],
    "rebalanceLogs": []
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

## Portfolio Allocations

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

### Delete Single Allocation

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

### Delete All Allocations

Remove all allocations from a portfolio.

**Endpoint:** `DELETE /allocations/:portfolioId`
**Authorization:** User role required

**Response:**
```json
{
  "message": "All allocations deleted successfully"
}
```

---

## Delegation System

### Create Delegation

Create a new delegation allowing a bot to trade on behalf of the user.

**Endpoint:** `POST /delegations/:smartAccountId`
**Authorization:** User role required

**Request Body:**
```json
{
  "monitoredTokens": ["string"]
}
```

**Response:**
```json
{
  "message": "Delegation created successfully",
  "delegation": {
    "id": "string",
    "smartAccountId": "string",
    "delegatorAddress": "string",
    "delegateAddress": "string",
    "createdAt": "string",
    "updatedAt": "string"
  }
}
```

**Error Responses:**
- `404`: User portfolio not found. Please create and deploy a portfolio first.

---

### Revoke Delegation

Revoke an existing delegation.

**Endpoint:** `PUT /delegations/:delegationId/revoke`
**Authorization:** User role required

**Response:**
```json
{
  "message": "Delegation revoked successfully",
  "delegationId": "string",
  "revokedAt": "string"
}
```

---

### Test Redeem Delegation

Test endpoint for delegation redemption (development/testing).

**Endpoint:** `POST /delegations/test/redeem`

**Request Body:**
```json
{
  "data": {
    "tokenIn": "string",
    "tokenOut": "string",
    "amountIn": "string",
    "amountOutMin": "string",
    "botAddress": "string",
    "swapPath": ["string"],
    "reason": "string"
  }
}
```

---

## Token Management

### Create Token

Add a new token to the system.

**Endpoint:** `POST /tokens`
**Authorization:** Admin required

**Request Body:**
```json
{
  "symbol": "string",
  "name": "string",
  "address": "string",
  "decimals": "number"
}
```

**Response:**
```json
{
  "id": "string",
  "symbol": "string",
  "name": "string",
  "address": "string",
  "decimals": "number",
  "createdAt": "string"
}
```

---

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

### Get Token by Address

Retrieve a token by its contract address.

**Endpoint:** `GET /tokens/address/:address`

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

### Delete Token

Remove a token from the system.

**Endpoint:** `DELETE /tokens/:id`
**Authorization:** Admin required

**Response:**
```json
{
  "message": "Token deleted successfully"
}
```

---

## Bot Management

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
