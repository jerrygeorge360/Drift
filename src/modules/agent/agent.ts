import Groq from "groq-sdk";
import { toolRegistry } from "./router.js";
import prisma from "../../config/db.js";

if (!process.env.GROQ_API_KEY) {
    throw new Error("GROQ_API_KEY is missing from environment variables.");
}

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

interface AgentMessage {
    role: "system" | "user" | "assistant" | "tool";
    content: string;
    name?: string;
}

interface ToolCall {
    tool: string;
    arguments: Record<string, any>;
}

interface FinalResponse {
    final_response: string;
}

type AgentResponse = ToolCall | FinalResponse;

export class SnapshotAgent {
    private model: string;
    private maxIterations: number = 10;

    private systemPrompt = `
You are a snapshot-analysis agent with tool calling capabilities.

Primary objective:
1. Call 'getLatestEntries' to fetch the latest 10 token price records.
2. Analyze the data deeply, looking for trends, volatility, or significant changes.
3. Use any provided 'Historical Context' (memories) to identify long-term patterns or recurring behaviors.
4. Save the full analysis using 'saveAnalysis'.
5. Produce a short memory summary (including the price data as text and an abridged analysis) and save it using 'saveMemorySummary'.
6. When both 'saveAnalysis' and 'saveMemorySummary' have been successfully called, return a final JSON response summarizing your work.

ALLOWED FORMATS:

For tool calls:
{
  "tool": "<toolName>",
  "arguments": { ... }
}

For final output:
{
  "final_response": "<text>"
}

STRICT RULES:
- Always use valid JSON.
- Do not include any text outside the JSON block.
- Call tools one at a time.
- Wait for the tool result before proceeding to the next step.
`;

    constructor(model: string = "llama-3.3-70b-versatile") {
        this.model = model;
    }

    async run(): Promise<string> {
        console.log(`[SnapshotAgent] Starting analysis run using model: ${this.model}`);

        // Fetch historical context (memories)
        const memories = await prisma.memory.findMany({
            orderBy: { createdAt: "desc" },
            take: 5
        });

        const memoryContext = memories.length > 0
            ? `Historical Context (Latest Memories):\n${memories.map(m => `- ${m.createdAt.toISOString()}: ${m.summary}`).join('\n')}`
            : "No historical context available.";

        const messages: AgentMessage[] = [
            { role: "system", content: this.systemPrompt },
            { role: "system", content: memoryContext },
            { role: "user", content: "Begin snapshot analysis now." }
        ];

        return await this.executionLoop(messages);
    }


    private async executionLoop(messages: AgentMessage[]): Promise<string> {
        let iterations = 0;

        while (iterations < this.maxIterations) {
            iterations++;
            console.log(`[SnapshotAgent] Iteration ${iterations}...`);

            try {
                const completion = await groq.chat.completions.create({
                    model: this.model,
                    messages: messages as any,
                    temperature: 0.2,
                    max_tokens: 1000,
                });

                const raw = completion.choices?.[0]?.message?.content?.trim();
                if (!raw) throw new Error("Empty LLM response");

                console.log(`[SnapshotAgent] LLM Response: ${raw}`);

                let parsed: AgentResponse;
                try {
                    parsed = JSON.parse(raw);
                } catch (e) {
                    console.warn(`[SnapshotAgent] Failed to parse JSON, attempting to extract...`);
                    const match = raw.match(/\{[\s\S]*\}/);
                    if (match) {
                        parsed = JSON.parse(match[0]);
                    } else {
                        throw new Error("LLM returned invalid JSON: " + raw);
                    }
                }

                // Handle Final Response
                if ("final_response" in parsed) {
                    console.log(`[SnapshotAgent] Final response received.`);
                    return parsed.final_response;
                }

                // Handle Tool Call
                if ("tool" in parsed) {
                    const toolName = parsed.tool;
                    const args = parsed.arguments || {};

                    console.log(`[SnapshotAgent] Calling tool: ${toolName} with args:`, args);

                    const tool = (toolRegistry as any)[toolName];
                    if (!tool) throw new Error(`Unknown tool: ${toolName}`);

                    const toolResult = await tool.execute(args);
                    console.log(`[SnapshotAgent] Tool result received.`);

                    messages.push({
                        role: "assistant",
                        content: raw
                    });

                    messages.push({
                        role: "tool",
                        name: toolName,
                        content: JSON.stringify({
                            tool: toolName,
                            result: toolResult
                        })
                    });

                    continue;
                }

                throw new Error("LLM response missing 'final_response' or 'tool' call.");

            } catch (error: any) {
                console.error(`[SnapshotAgent] Error in execution loop:`, error.message);
                throw error;
            }
        }

        throw new Error(`[SnapshotAgent] Reached maximum iterations (${this.maxIterations}) without a final response.`);
    }
}
