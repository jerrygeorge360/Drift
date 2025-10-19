import { llmDecisionEngine } from "./bot.service.js";
import { LLMAdjustment } from "./bot.types.js";

export async function getLLMDecision(bot: any, context: string, agentMode: string) {
    const llmPrompt = `
You are an AI portfolio manager bot named ${bot.name}.
You are operating in **${agentMode} mode**.

Based on the data above, decide whether to:
  - "redeem": rebalance and redeem delegations.
  - "none": Do nothing (portfolio is within acceptable range)

${context}

If you decide to rebalance, specify which tokens to swap. Each adjustment should help bring allocations closer to target.
`;

    const llmDecision = await llmDecisionEngine(bot.name, llmPrompt);
    return llmDecision as {
        action: string;
        reason: string;
        adjustments: LLMAdjustment[];
    };
}
