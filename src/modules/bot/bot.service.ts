import Groq from "groq-sdk";

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY!,
});

export interface LLMDecision {
    action: string;
    reason: string;
    tokenInSymbol?: string;
    tokenOutSymbol?: string;
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
    console.log(`🧠 [${botName}] Thinking...`);

    try {
        const completion = await groq.chat.completions.create({
            model: "llama-3.3-70b-versatile",
            messages: [
                {
                    role: "system",
                    content: `You are an autonomous blockchain AI agent named ${botName}.
          You analyze on-chain activities, portfolio data, and delegations.
          Always respond in **strict JSON** format like this:
          {
            "action": "delegate" | "redeem" | "rebalance" | "analyze",
            "reason": "Explain why this decision is made",
            "adjustments": [
            {
              "tokenInId": "string",
              "tokenOutId": "string",
              "percent": number
            }
            ]
          }`,
                },
                {
                    role: "user",
                    content: context,
                },
            ],
            temperature: 0.4,
            max_tokens: 500,
        });

        const rawText = completion.choices?.[0]?.message?.content?.trim() || "";
        console.log(`🤖 [${botName}] Raw response:`, rawText);

        // Try parsing valid JSON; fallback to safe extraction
        try {
            const parsed = JSON.parse(rawText);
            return parsed as LLMDecision;
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
