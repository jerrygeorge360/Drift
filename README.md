# 🌊 Drift

**Drift** is an **intelligent on-chain portfolio management protocol** built for the **Monad ecosystem**.
It introduces **autonomous portfolio automation** powered by **MetaMask Smart Accounts** and a **delegated AI-driven execution layer**, enabling seamless, explainable, and scalable on-chain asset management.

Drift is designed for the next generation of decentralized finance — where users, institutions, and automated agents collaborate securely through programmable delegation.

---

## 💡 Vision

To redefine **on-chain portfolio management** through **automation, transparency, and intelligence**.
Drift aims to become the foundational layer for decentralized investment infrastructure on Monad — enabling both individuals and protocols to manage portfolios, strategies, and funds autonomously, with verifiable logic and zero manual upkeep.

---

## ✨ Core Capabilities

### 🧩 Dynamic Portfolio Allocations

Define, adjust, and evolve target asset allocations (e.g., 40% ETH, 30% USDC, 30% MON) in real time through Drift’s smart interfaces.

### ⚙️ Delegated Automation Layer

Authorize a **delegated execution bot** to continuously monitor your portfolio and execute optimal rebalances — all verifiable on-chain and governed by smart account permissions.

### 🧠 Explainable Intelligence

Every Drift action — from a swap to a rebalance — is **explainable**.
Each decision includes contextual reasoning and metrics, ensuring total transparency and auditability.

### 🌐 Envio-Powered Event Indexing

All portfolio activity, rebalances, and historical data are indexed via **Envio**, exposing a **GraphQL API** for analytics dashboards, dApps, or external integrations.

### 🔗 Chain-Agnostic Design

Although natively deployed on **Monad**, Drift’s architecture is **EVM-compatible**, allowing seamless deployment across any chain with minimal configuration.

---

## 🛠 Tech Stack

| Layer        | Technology                               | Purpose                                   |
| ------------ |------------------------------------------| ----------------------------------------- |
| **Smart Contracts** | Solidity + Hardhat (Monad testnet)       | Core portfolio + delegation logic         |
| **Automation** | MetaMask Smart Accounts                  | Permissioned delegated execution          |
| **Backend**  | Node.js + TypeScript + Prisma (Postgres) | Data orchestration and analytics          |
| **Indexing** | [Envio](https://envio.dev/)              | Real-time portfolio event tracking        |
| **Testing**  | Viem (Monad Client)                      | On-chain simulation and assertion testing |
| **Frontend** | Vite + MetaMask SDK                      | User-facing control & analytics dashboard |

---

## 🧭 Architectural Overview

Drift is designed around **three autonomous layers**:

1. **Execution Layer** – Solidity-based smart contracts govern all portfolio and rebalance logic.
2. **Automation Layer** – Delegated bots (AI agents) manage timing, pricing, and rebalance frequency.
3. **Data Layer** – Envio indexes every event for real-time insights and external integrations.

```
User → MetaMask Smart Account → Delegated Bot → Rebalance → Envio Indexer → Analytics / Dashboard
```

This modular architecture ensures **composability**, **scalability**, and **chain-agnostic deployment**.

---

## 🚀 Why Drift Changes the Game

* **Intelligent Automation:** Real-time delegated bots eliminate manual portfolio maintenance.
* **Verifiable On-Chain Actions:** Every rebalance is transparent, auditable, and provably executed through smart accounts.
* **AI-Ready Design:** Built with explainable action logs, Drift enables future AI-assisted investment strategies.
* **Composable Infrastructure:** Can integrate seamlessly with DeFi protocols, wallets, and asset management layers.
* **Developer-First:** Modular contracts, APIs, and SDKs for extending Drift into your own applications.

---

## 🏆 Hackathon & Ecosystem Fit

| Category                              | Why Drift Excels                                                                        |
| ------------------------------------- | --------------------------------------------------------------------------------------- |
| **Best AI Agent**                     | Drift’s delegated bots act as intelligent agents that explain and justify every action. |
| **Best On-Chain Automation**          | True on-chain rebalancing using MetaMask Smart Account delegation.                      |
| **Best Consumer App**                 | Hands-free asset management with full analytics and transparency.                       |
| **Most Innovative Use of Delegation** | Secure, permission-based control flow between users and automation bots.                |
| **Best Use of Envio**                 | Live, queryable indexing of all portfolio activities for dashboards and analytics.      |

---

## 📌 Current Progress

* ✅ Mock ERC20 tokens & swap router for Monad local environment
* ✅ Allocation + rebalance contracts deployed and verified
* ✅ Delegation logic integrated with MetaMask Smart Accounts
* 🔲 Frontend dashboard under development
* 🔲 Multi-token and multi-chain deployment
* 🔲 AI-enhanced rebalancing engine (planned)

---

## ⚖️ License

**MIT License** — open for research, extension, and contribution.

---
