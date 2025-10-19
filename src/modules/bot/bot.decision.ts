import { llmDecisionEngine } from "./bot.service.js";
import { LLMAdjustment } from "./bot.types.js";

interface LLMDecisionResponse {
    action: "rebalance" | "none";
    reason: string;
    adjustments: LLMAdjustment[];
}

/**
 * Get LLM decision for portfolio management
 * @param bot - Bot configuration
 * @param context - Portfolio and market context
 * @param agentMode - Operating mode
 */
export async function getLLMDecision(
    bot: any,
    context: string,
    agentMode: string
): Promise<LLMDecisionResponse> {

    const llmPrompt = buildDecisionPrompt(bot, context, agentMode);

    try {
        const llmDecision = await llmDecisionEngine(bot.name, llmPrompt);

        // Validate and sanitize the response
        return validateLLMResponse(llmDecision);

    } catch (error: any) {
        console.error(`❌ LLM decision failed:`, error.message);

        // Return safe default
        return {
            action: "none",
            reason: `LLM decision failed: ${error.message}`,
            adjustments: [],
        };
    }
}

/**
 * Build the LLM prompt with clear instructions
 */
function buildDecisionPrompt(bot: any, context: string, agentMode: string): string {
    return `
You are an AI portfolio manager bot named "${bot.name}".
You are operating in **${agentMode.toUpperCase()} mode**.

${context}

---

Your task is to analyze the portfolio and decide on the best action.

AVAILABLE ACTIONS:
1. "rebalance" - Adjust token allocations to match targets (includes delegation/redemption operations)
2. "none" - No action needed (portfolio is within acceptable range)

DECISION CRITERIA:
${getDecisionCriteria(agentMode)}

RESPONSE FORMAT (JSON):
{
  "action": "rebalance" | "none",
  "reason": "Brief explanation of your decision (max 200 chars)",
  "adjustments": [
    {
      "tokenOut": "token_symbol_to_reduce",
      "tokenIn": "token_symbol_to_increase", 
      "percentage": 5.5,
      "reason": "Why this swap is needed"
    }
  ]
}

IMPORTANT RULES:
- If action is "none", adjustments must be an empty array []
- If action is "rebalance", provide 1-3 specific adjustments to bring allocations closer to target
- Keep percentage adjustments moderate (max ±10% per token)
- Consider transaction costs - avoid tiny adjustments (<2%)
- Each adjustment should clearly state which token to reduce (tokenOut) and which to increase (tokenIn)
- The bot will handle the actual delegation/redemption mechanics
- Provide clear, concise reasoning

Respond ONLY with valid JSON, no additional text.
`.trim();
}

/**
 * Get decision criteria based on agent mode
 */
function getDecisionCriteria(mode: string): string {
    switch (mode) {
        case "smart":
        case "urgent":
            return `
- Rebalance if ANY token deviates >3% from target
- Consider market volatility and momentum
- Be proactive with adjustments (up to ±10% per token)
- Prioritize capital preservation in volatile markets
- React quickly to significant market movements
            `.trim();

        case "manual":
            return `
- Only execute if explicitly instructed
- Default to "none" unless clear signals present
- Provide detailed reasoning for any action
            `.trim();

        case "test":
            return `
- Simulate decisions without executing
- Be more aggressive to test edge cases
- Provide extensive reasoning for learning purposes
            `.trim();

        case "auto":
        default:
            return `
- Rebalance only if any token deviates >5% from target
- Minimize transaction costs and gas fees
- Avoid frequent small adjustments (<2%)
- Default to "none" when portfolio is within tolerance
- Consider recent rebalance history to avoid over-trading
            `.trim();
    }
}

/**
 * Validate and sanitize LLM response
 */
function validateLLMResponse(response: any): LLMDecisionResponse {
    // Handle string responses (parse JSON)
    if (typeof response === 'string') {
        try {
            // Extract JSON from markdown code blocks if present
            const jsonMatch = response.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
            if (jsonMatch) {
                response = JSON.parse(jsonMatch[1]);
            } else {
                response = JSON.parse(response);
            }
        } catch (error) {
            console.error('❌ Failed to parse LLM response:', response);
            throw new Error('Invalid JSON response from LLM');
        }
    }

    // Validate action
    const validActions = ["rebalance", "none"];
    if (!validActions.includes(response.action)) {
        console.warn(`⚠️ Invalid action "${response.action}", defaulting to "none"`);
        response.action = "none";
    }

    // Validate reason
    if (!response.reason || typeof response.reason !== 'string') {
        response.reason = "No reason provided";
    } else {
        // Trim to max 200 chars
        response.reason = response.reason.slice(0, 200);
    }

    // Validate adjustments
    if (!Array.isArray(response.adjustments)) {
        console.warn('⚠️ Adjustments is not an array, defaulting to []');
        response.adjustments = [];
    }

    // Clean adjustments
    response.adjustments = response.adjustments
        .filter((adj: any) => {
            // Must have required fields
            if (!adj.tokenOut || !adj.tokenIn || typeof adj.percentage !== 'number') {
                console.warn('⚠️ Invalid adjustment, skipping:', adj);
                return false;
            }

            // Can't swap same token
            if (adj.tokenOut === adj.tokenIn) {
                console.warn('⚠️ tokenOut and tokenIn are the same, skipping:', adj);
                return false;
            }

            // Percentage must be reasonable
            if (adj.percentage <= 0 || adj.percentage > 50) {
                console.warn(`⚠️ Invalid percentage ${adj.percentage}%, skipping adjustment`);
                return false;
            }

            return true;
        })
        .map((adj: any) => ({
            tokenOut: adj.tokenOut.toLowerCase(),
            tokenIn: adj.tokenIn.toLowerCase(),
            percentage: Number(adj.percentage.toFixed(2)),
            reason: adj.reason || "No reason provided",
        }));

    // If action is "none", clear adjustments
    if (response.action === "none") {
        response.adjustments = [];
    }

    // If action is "rebalance" but no adjustments, change to "none"
    if (response.action === "rebalance" && response.adjustments.length === 0) {
        console.warn('⚠️ Action is "rebalance" but no valid adjustments provided, changing to "none"');
        response.action = "none";
        response.reason = "No valid adjustments could be determined";
    }

    // Log the validated decision
    console.log(`🤖 LLM Decision:`, {
        action: response.action,
        reason: response.reason,
        adjustments: response.adjustments.length,
    });

    return response as LLMDecisionResponse;
}

/**
 * Helper to check if decision is valid
 */
export function isValidDecision(decision: LLMDecisionResponse): boolean {
    if (!decision || typeof decision !== 'object') return false;
    if (!['rebalance', 'none'].includes(decision.action)) return false;
    if (!decision.reason || typeof decision.reason !== 'string') return false;
    if (!Array.isArray(decision.adjustments)) return false;

    return true;
}