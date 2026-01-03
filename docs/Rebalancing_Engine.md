# Drift Rebalancing Engine Documentation

## Overview

The Drift Rebalancing Engine is the core autonomous trading component of MetaSmartPort. It implements sophisticated portfolio drift detection, intelligent trade generation, and comprehensive risk management to maintain user-defined asset allocations while minimizing unnecessary trading.

---

## Core Architecture

### Drift Detection Algorithm

The engine calculates portfolio drift using the following formula:

```typescript
const drift = (currentValue - targetValue) / targetValue
```

**Key Parameters:**
- **Drift Threshold**: 15% (configured to handle testnet price volatility)
- **Cooldown Period**: 15 minutes between rebalances
- **Health Checks**: Token health validation before trades

### Multi-Token Rebalancing Strategy

The engine implements a sophisticated multi-token rebalancing approach:

1. **Value Calculation**: Computes total portfolio value in USD
2. **Drift Analysis**: Identifies tokens exceeding drift thresholds
3. **Trade Matching**: Pairs oversized tokens (sells) with undersized tokens (buys)
4. **Hysteresis Logic**: Calculates exact amounts needed to return to target allocations

---

## Intelligent Safeguards

### 1. Testnet Price Volatility Protection

**Problem**: Testnet price feeds can be extremely volatile, causing excessive trading.

**Solution**: 
- 15% drift threshold (vs typical 5% on mainnet)
- Prevents minor fluctuations from triggering unnecessary trades
- Reduces gas costs and slippage impact

```typescript
const driftTolerance = 0.15; // 15% threshold for testnet
if (maxDrift < driftTolerance) {
    return { action: "NO_REBALANCE", reason: "All tokens within drift tolerance" };
}
```

### 2. Cooldown System

**Problem**: Rapid successive rebalances can compound losses through gas costs and slippage.

**Solution**:
- 15-minute mandatory cooldown between rebalances
- System tracks last rebalance timestamp per portfolio
- Prevents emotional/algorithmic overtrading

```typescript
const COOLDOWN_MINUTES = 15;
const lastRebalanceTime = await getLastRebalanceTime(portfolioId);
const cooldownRemaining = COOLDOWN_MINUTES - minutesSinceLastRebalance;

if (cooldownRemaining > 0) {
    return res.status(429).json({
        message: `Cooldown active. Next rebalance available in ${cooldownRemaining} minutes`
    });
}
```

### 3. Slippage Protection

**On-Chain Quote Integration**:
- Real-time swap quotes from DEX routers
- 1% slippage tolerance applied to all trades
- Protects against MEV attacks and price manipulation

```typescript
const estimatedAmounts = await getEstimatedOut(
    portfolio.portfolioAddress,
    amountInWei,
    swapPath
);
const slippageTolerance = 0.01; // 1%
const amountOutMin = BigInt(Math.floor(Number(expectedOut) * (1 - slippageTolerance)));
```

---

## Rebalance Execution Flow

### Step 1: Market Data Processing
```
Oracle Poller → Price Feeds (CoinGecko OR Uniswap Router) → Database → Webhook Trigger
```

**Pricing Strategy**:
The system supports two pricing sources, configured via `PRICE_SOURCE`:
1.  **ORACLE (CoinGecko)**: Uses off-chain data. Good for general market trends but may lag behind on-chain liquidity.
2.  **ROUTER (Uniswap V2)**: Uses on-chain spot prices from the DEX. Ensures trades are executed at the exact price visible to the contract, eliminating "phantom" arbitrage opportunities caused by oracle lag.

### Step 2: Portfolio Analysis
```typescript
// 1. Fetch all active portfolios
const portfolios = await db.portfolio.findMany({
    where: { isActive: true },
    include: { allocations: { include: { token: true } } }
});

// 2. Check cooldown status
const lastRebalance = await db.rebalanceLog.findFirst({
    where: { portfolioId },
    orderBy: { timestamp: 'desc' }
});

// 3. Calculate drift for each portfolio
const mappedPortfolio = mapPortfolio(portfolio);
const result = await rebalancePortfolio(mappedPortfolio, prices, health, 0.15);
```

### Step 3: Trade Execution
```typescript
if (result.action === "REBALANCE") {
    // Execute delegation-based trades
    const redeemResult = await redeemDelegationService(
        delegation.signature,
        result.params,
        smartAccount.address
    );
    
    // Log comprehensive trade details
    await db.rebalanceLog.create({
        data: {
            portfolioId,
            timestamp: new Date(),
            status: 'SUCCESS',
            transactionHash: redeemResult.transactionHash,
            gasUsed: redeemResult.gasUsed,
            gasCost: redeemResult.gasCost,
            driftPercentage: result.maxDrift,
            tokenAmounts: JSON.stringify(result.params),
            swapPath: JSON.stringify(swapPaths)
        }
    });
}
```

---

## Performance Tracking

### Comprehensive Logging

The system tracks detailed metrics for each rebalance:

| Field | Description | Purpose |
|-------|-------------|---------|
| `driftPercentage` | Maximum drift that triggered rebalance | Performance analysis |
| `transactionHash` | On-chain transaction reference | Audit trail |
| `gasUsed` | Gas consumption for the trade | Cost analysis |
| `gasCost` | USD cost of gas fees | ROI calculation |
| `tokenAmounts` | Exact amounts traded | Position tracking |
| `swapPath` | Token swap route taken | Execution verification |
| `executionTime` | Time from trigger to completion | Latency monitoring |


---

## Risk Management


### Health Gate Integration

```typescript
// Skip unhealthy tokens (future feature)
if (health[token.symbol] && health[token.symbol] !== "HEALTHY") {
    console.log(`Skipping ${token.symbol} - health status: ${health[token.symbol]}`);
    continue;
}
```

---


---


The Drift Rebalancing Engine represents a sophisticated approach to automated portfolio management, balancing the need for precise allocation maintenance with practical considerations of cost, slippage, and market volatility.
