# AI Snapshot Agent System

The **AI Snapshot Agent** is the intelligence layer of MetaSmartPort. It uses a Large Language Model (LLM) to analyze market conditions, maintain historical context, and provide explainable insights for every portfolio action.

## 🧠 Architecture

The agent is built on a **ReAct (Reasoning + Acting)** loop, allowing it to:
1.  **Observe**: Look at the current task (e.g., "Analyze market conditions for ETH").
2.  **Reason**: Decide what information is needed (e.g., "I need current prices and historical volatility").
3.  **Act**: Call specific tools to fetch that information.
4.  **Synthesize**: Combine the data into a coherent analysis.

### Core Components

*   **Model**: Llama 3.3-70B (via Groq) for high-speed, high-quality inference.
*   **Memory**: A persistent storage system that retains "short-term" and "long-term" context.
*   **Tools**: A set of deterministic functions the agent can invoke.

---

## 💾 Memory System

One of the key innovations in Drift is the agent's ability to "remember" previous states. This prevents the AI from treating every analysis as an isolated event.

### Memory Structure

Each memory entry consists of:
*   **Summary**: A condensed version of the previous analysis.
*   **Key Metrics**: Volatility score, trend direction (Bullish/Bearish/Neutral).
*   **Timestamp**: When the memory was created.

### Context Loading

When the agent starts a new analysis:
1.  It fetches the last **5 memory entries** from the database.
2.  These are injected into the system prompt as "Historical Context".
3.  The agent uses this to identify **trend shifts** (e.g., "Market was bearish yesterday, but is now showing signs of reversal").

---

## 🛠️ Tools

The agent has access to the following tools:

### 1. `fetch_prices`
*   **Description**: Retrieves current and historical price data for a specific token.
*   **Parameters**: `tokenSymbol` (e.g., "ETH"), `days` (e.g., 7).
*   **Returns**: Array of price points [timestamp, price].

### 2. `get_portfolio_drift`
*   **Description**: Calculates the current drift for a given portfolio.
*   **Parameters**: `portfolioId`.
*   **Returns**: Drift percentage and specific token deviations.

### 3. `save_analysis`
*   **Description**: Persists the final analysis to the database.
*   **Parameters**: `content` (markdown), `sentiment` (score 0-100).

---

## 🔄 Operational Flow

1.  **Trigger**: The `scheduler` enqueues an analysis job (every 30 mins).
2.  **Freshness Check**: The worker checks if new price data has arrived since the last analysis. If not, it skips (saving costs).
3.  **Execution**:
    *   Agent initializes with system prompt + memory.
    *   Agent calls `fetch_prices` for all assets.
    *   Agent generates the analysis.
4.  **Persistence**:
    *   Full analysis saved to `Analysis` table.
    *   Summary saved to `Memory` table.
5.  **Notification**:
    *   System emits an SSE event `new_analysis`.
    *   Dashboard updates in real-time.

## 📝 Example Output

```markdown
## Market Snapshot: ETH/USDC

**Sentiment**: Neutral-Bullish (65/100)

**Analysis**:
Ethereum has shown resilience over the last 24 hours, bouncing off the $2,800 support level. 
Compared to yesterday's analysis (where we saw high volatility), the market has stabilized. 
Volume is increasing, suggesting a potential breakout.

**Recommendation**:
Maintain current allocations. The slight drift (2%) is within tolerance and does not warrant a rebalance yet.
```
