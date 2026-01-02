# Drift System Flows

This document outlines the operational flows for the three primary roles in the Drift ecosystem: **User**, **Bot**, and **Admin**.

---

## 1. User Flows

The User flow focuses on account setup, asset management, and delegating control for automated rebalancing.

### A. Authentication & Onboarding
1.  **Sign-In (SIWE)**: User connects their EOA (Externally Owned Account) via MetaMask and signs a SIWE message.
2.  **JWT Issuance**: Server verifies the signature and issues a JWT for session management.
3.  **Smart Account Creation**: User requests a Smart Account (ERC-4337). The system generates a deterministic address and stores the encrypted owner key.
4.  **Portfolio Initialization**: A default portfolio is created and linked to the Smart Account.

### B. Delegation Management
1.  **Create Delegation**:
    *   User selects tokens to be monitored.
    *   User signs a "Delegation" permission off-chain.
    *   The signature is stored in the database, granting the "Drift" bot limited authority.
2.  **Revoke Delegation**:
    *   User decides to stop automation.
    *   User calls the revoke endpoint.
    *   The system marks the delegation as `revoked`, immediately stopping any bot actions.
3.  **Recreate Delegation**:
    *   User revokes the old delegation.
    *   User signs a new permission set (e.g., with updated token lists).
    *   The new signature replaces the old one in the automation flow.

### C. Monitoring
1.  **View Portfolio**: User checks current balances and target allocations.
2.  **Activity Logs**: User views `RebalanceLogs` to see historical trades executed by the bot, including gas costs and transaction hashes.

---

## 2. Bot Flows (Automation)

The Bot flow is the "heartbeat" of the system, running autonomously to maintain portfolio health.

### A. Market Intelligence (Oracle)
1.  **Price Polling**: The `poller.ts` service triggers the Oracle every 2 minutes.
2.  **Data Fetching**: Oracle fetches prices from CoinGecko for all monitored tokens.
3.  **Database Sync**: Fresh prices are saved to the `TokenPrice` table.
4.  **Trigger**: The Oracle calls the system Webhook with the new market data.

### B. Analysis & Execution (Rebalancer)
1.  **Portfolio Scanning**: The Webhook controller fetches all active portfolios.
2.  **Drift Analysis**: For each portfolio, the Rebalancer calculates if any token has drifted >5% from its target.
3.  **Trade Generation**: If drift is detected, the engine generates specific swap instructions (e.g., Sell 0.1 WBTC for USDC).
4.  **Delegation Redemption**:
    *   The bot retrieves the User's stored delegation signature.
    *   The bot constructs a UserOperation (UserOp).
    *   The bot submits the UserOp to the Bundler (Pimlico).
5.  **On-Chain Swap**: The `DelegationManager` verifies the signature and executes the swap on the DEX.
6.  **Logging**: The bot records the successful trade in the `RebalanceLog`.

---

## 3. Admin Flows

The Admin flow is for system maintenance, security, and configuration.

### A. Bot Management
1.  **Provisioning**: Admin creates new Bot identities (e.g., "Drift", "Sentinel") and provides their addresses/keys.
2.  **Status Control**: Admin can activate or deactivate bots globally.
3.  **Key Rotation**: Admin can update bot private keys if security is compromised.

### B. Contract Configuration
1.  **Global Pause**: Admin can pause the system-wide rebalancing logic in case of extreme market volatility or contract bugs.
2.  **Address Updates**: Admin updates the addresses of core contracts (Factory, DelegationManager, DEX Router) in the `ContractConfig` table.
3.  **Network Management**: Admin configures RPC endpoints and Bundler URLs for different chains (Monad, Sepolia).

### C. System Health Monitoring
1.  **Oracle Health**: Admin monitors the `consecutiveFailures` of the price poller.
2.  **Trade Success Rate**: Admin reviews logs to identify failed trades (e.g., due to "Insufficient Balance" or "High Slippage").

---

## 4. AI Agent Flow (Snapshot Analysis)

The AI Agent acts as a high-level observer, providing deep insights and maintaining a "memory" of the system's state.

### A. Scheduling & Triggering
1.  **Scheduler**: A background job (`scheduler.ts`) runs every 30 minute and adds a task to the Redis-backed `ai-agent-queue`.
2.  **Worker**: A dedicated worker process (`agent.worker.ts`) picks up the task and initializes the `SnapshotAgent`.

### B. Intelligent Analysis
1.  **Freshness Check**: The agent compares the timestamp of the latest `TokenPrice` against the latest `Analysis`. It only proceeds if new data is available.
2.  **Context Loading**: The agent retrieves the last 5 "Memories" from the database to provide historical context to the LLM.
3.  **LLM Reasoning (Groq)**: The agent uses the `llama-3.3-70b` model to:
    *   Fetch the latest 10 price records.
    *   Identify trends, volatility, and anomalies.
    *   Compare current data against historical patterns.
4.  **Output Generation**:
    *   **Deep Analysis**: A comprehensive breakdown of the market state, saved to the `Analysis` table.
    *   **Memory Summary**: A condensed version of the findings, saved to the `Memory` table to inform future analysis runs.

### C. Real-time Updates
1.  **SSE Emission**: When a new analysis is saved, the system triggers a Server-Sent Event (SSE).
2.  **Frontend Notification**: Connected clients receive the `new_analysis` event in real-time, allowing users to see the AI's insights without refreshing.

