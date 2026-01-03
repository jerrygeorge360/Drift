# Drift Deployment Guide

This guide covers the deployment of the Drift system, including environment configuration, database setup, and service orchestration.

##  Prerequisites

Before deploying, ensure you have the following installed:

*   **Node.js**: v18 or higher
*   **PostgreSQL**: v14 or higher
*   **Redis**: v6 or higher (required for BullMQ)
*   **Git**: For version control

## Environment Configuration

Create a `.env` file in the root directory. You can start by copying the example:

```bash
cp .env.example .env
```

### Core Configuration

| Variable | Description | Default/Example |
| :--- | :--- | :--- |
| `PORT` | API Server Port | `3000` |
| `DATABASE_URL` | PostgreSQL Connection String | `postgresql://user:pass@localhost:5432/drift` |
| `REDIS_URL` | Redis Connection String | `redis://localhost:6379` |
| `NODE_ENV` | Environment | `development` or `production` |

### Blockchain Configuration

| Variable | Description | Example |
| :--- | :--- | :--- |
| `RPC_URL` | Monad Testnet RPC URL | `https://testnet-rpc.monad.xyz/` |
| `PRIVATE_KEY` | Deployer/Bot Private Key | `0x...` |
| `PIMLICO_API_KEY` | Bundler API Key (if using Pimlico) | `pimlico_...` |
| `CHAIN_ID` | Chain ID | `10143` (Monad) |

### Smart Contract Addresses

| Variable | Description |
| :--- | :--- |
| `SMART_ACCOUNT_FACTORY_ADDRESS` | Address of the deployed SmartAccountFactory |
| `DELEGATION_MANAGER_ADDRESS` | Address of the DelegationManager contract |
| `UNISWAP_V2_ROUTER` | Address of the Uniswap V2 Router |
| `USDC_ADDRESS` | Address of the USDC token |
| `WMON_ADDRESS` | Address of the Wrapped Monad token |

### Rebalancing Engine Configuration

| Variable | Description | Default |
| :--- | :--- | :--- |
| `PRICE_SOURCE` | Price feed source | `ROUTER` or `ORACLE` |

### AI Agent Configuration

| Variable | Description |
| :--- | :--- |
| `GROQ_API_KEY` | API Key for Groq (Llama 3.3) |

##  Deployment Steps

### 1. Database Setup

Initialize the database schema:

```bash
# Run migrations
npx prisma migrate deploy

# Generate Prisma client
npx prisma generate
```

### 2. Build the Project

Compile the TypeScript code:

```bash
npm run build
```

### 3. Start Services

Drift consists of three main services that should run concurrently.

#### A. API Server
Handles user requests, dashboard data, and webhooks.

```bash
npm run start:server
```

#### B. Worker
Processes background jobs (AI analysis, rebalancing tasks).

```bash
npm run start:worker
```

#### C. Poller
Monitors on-chain prices and triggers rebalancing checks.

```bash
npm run start:poller
```

### D. Run all services
```bash
npm run dev:all
```
This command will automatically:
1.  Clean the `dist` folder.
2.  Generate Prisma Client.
3.  Build the TypeScript project.
4.  Run database migrations.
5.  Start all services.

## Docker Deployment
```bash
docker-compose up --build
```

This will start:
*   **API Server**: `http://localhost:4000`
*   **Prisma Studio**: `http://localhost:5555`
*   **PostgreSQL**: Port `5432`
*   **Redis**: Port `6379`
*   **Worker & Poller**: Background services

---


## Verification

After deployment, verify the system is running correctly:

1.  **Check Logs**: Ensure `drift-poller` is fetching prices and `drift-worker` is ready to process jobs.
2.  **Test Rebalance**: Manually trigger a rebalance or wait for the poller to detect drift.
