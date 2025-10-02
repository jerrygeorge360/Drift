
---

# 🌊 Drift

**Drift** is a **non-custodial smart portfolio manager** built on **Monad** using **MetaMask Smart Accounts**.
It allows users to define portfolio allocations (e.g., 50% Token A, 50% Token B) and automatically rebalances assets **on-chain** while keeping full control of their funds.

---

## ✨ What Drift Does

* **Monad Native Deployment** → Smart contracts deployed and tested on the **Monad testnet**.
* **Portfolio Allocations** → Users define how their assets should be distributed.
* **Automatic Rebalancing** → A delegated bot monitors portfolios and executes swaps to maintain target allocations.
* **Explainable Actions** → Every bot action provides a clear reason or suggestion for transparency.
* **Non-Custodial** → Funds always remain in the user’s MetaMask Smart Account; Drift never holds user assets.
* **Event Indexing with Envio** → All allocations, rebalances, and transaction history are tracked and queryable via GraphQL.

---

## 🛠 Tech at a Glance

* **Smart Contracts:** Solidity, Hardhat, deployed on **Monad testnet**
* **Backend:** Node.js, TypeScript, Prisma (Postgres)
* **Testing:** Viem (Monad client + assertions)
* **Indexing:** [Envio](https://envio.dev/) for real-time event tracking
* **Frontend (Planned):** React + MetaMask SDK for non-custodial user interactions

---

## 🌐 Monad-Focused & Chain-Agnostic Design

* Drift leverages **Monad’s environment** with MetaMask Smart Accounts for **secure, delegated actions**.
* **Chain-Agnostic Architecture:** Drift can be deployed on any EVM-compatible chain; only RPC URLs, router addresses, and contract addresses need updates.
* **Standardized Interfaces:** ERC-20 tokens + UniswapV2-style routers ensure compatibility across chains.
* **Bot & Backend:** Fully decoupled from chain-specific logic, using standard EVM primitives and smart account delegation.
* **Analytics:** Event indexing via Envio works seamlessly on Monad or any other supported chain.

---

## 🚀 Why Drift Matters

* Makes **crypto portfolio management hands-off and automated** on Monad.
* Users retain **full control and transparency** over funds via MetaMask Smart Accounts.
* Lays the foundation for **multi-strategy portfolios, predictive AI rebalancing, and automated trading**.

---

## 🎯 Hackathon Fit

1. **Best AI Agent** → The delegated bot intelligently rebalances portfolios automatically.

    * **Explainable Actions:** Each rebalance or trade includes a reason or suggestion.
    * **LLM-Powered Decisions:** Bot analyzes portfolio and market data to provide actionable insights.

2. **Best On-Chain Automation** → Rebalances happen **on-chain** using MetaMask Smart Account delegation, fully trustless and verifiable on **Monad**.

3. **Best Consumer App** → Users can define allocations, track portfolio performance, and receive actionable advice via a simple non-custodial interface.

4. **Most Innovative Use of Delegation** → MetaMask Smart Account delegation allows bots to act **without custody**, a novel approach for automated, safe on-chain actions.

5. **Best Use of Envio** → Portfolio events (allocations, rebalances, transaction history) are indexed and queryable **in real-time**, enabling dashboards and analytics.

---

## 📌 Current Status

* ✅ Mock ERC20 tokens and swap router for local testing on Monad
* ✅ Allocation + rebalance with explainable bot logic working
* ✅ Delegation enables automated bot-driven rebalances
* 🔲 Frontend dashboard for users
* 🔲 Multi-token, multi-chain support
* 🔲 Full testnet deployment

---

## 📜 License

MIT License

---

## 📈 Workflow Diagram

```
User → MetaMask Smart Account → Delegated Bot → Rebalance → Envio → Dashboard / Analytics
```
