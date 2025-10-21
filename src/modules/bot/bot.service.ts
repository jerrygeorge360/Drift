import Groq from "groq-sdk";

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY!,
});

export interface LLMDecision {
    action: string;
    reason: string;
    tokenIn?: string;
    tokenOut?: string;
    percentChange?: number;
    [key: string]: any; // For flexibility (optional)
}

/**
 * LLM Decision Engine
 * Uses Groq to reason about blockchain actions like delegations, rebalances, etc.
 *
 * @param botName - Name of the AI agent/bot
 * @param context - Context or situation for the bot to analyze
 * @returns Structured decision result from the LLM
 */
export async function llmDecisionEngine(botName: string, context: string): Promise<LLMDecision> {
    console.log(`🧠 [${botName}] Evaluating portfolio...`);

    const systemPrompt = `
  You are an AI Smart Portfolio Manager named ${botName}.

  Your responsibility is to maintain healthy portfolio allocations.
  You receive data such as current token weights, target weights, market conditions, and total portfolio value.
  Your task is to decide whether to:
  - **rebalance** (if portfolio drift or imbalance is significant), or
  - **analyze** (if everything is within acceptable range and no action is needed).

  Decision guidelines:
  1. **Rebalance Threshold:** Trigger rebalancing only if any token’s deviation exceeds ±5% from its target allocation.
  2. **Minimal Movement:** Prefer the smallest adjustments necessary to restore target balance.
  3. **Volatility Awareness:** If the market is unusually volatile, avoid rebalancing unless absolutely needed.
  4. **Consistency:** Prevent redundant rebalances within short time frames.
  5. **Diversification:** Ensure no single asset dominates the portfolio.

  Output format (STRICT JSON):
  {
    "action": "rebalance" | "analyze",
    "reason": "Explain why this decision was made",
    "adjustments": [
      {
        "tokenIn": "string",
        "tokenOut": "string",
        "percent": number
      }
    ]
  }

  Never include markdown, explanations, or text outside this JSON.
  `;

    try {
        const completion = await groq.chat.completions.create({
            model: "llama-3.3-70b-versatile",
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: context },
            ],
            temperature: 0.4,
            max_tokens: 500,
        });

        const rawText = completion.choices?.[0]?.message?.content?.trim() || "";
        console.log(`🤖 [${botName}] Raw response:`, rawText);

        try {
            return JSON.parse(rawText) as LLMDecision;
        } catch {
            console.warn("⚠️ Groq returned non-JSON response, attempting to extract JSON...");
            const match = rawText.match(/\{[\s\S]*\}/);
            if (match) return JSON.parse(match[0]) as LLMDecision;
            throw new Error("Invalid JSON format from LLM");
        }
    } catch (error: any) {
        console.error("❌ LLM Decision Engine error:", error.message);
        throw new Error("LLM decision engine failed");
    }
}
