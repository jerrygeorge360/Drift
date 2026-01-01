import Groq from "groq-sdk";
import { snapshotTools } from "./tools.js";
import { executeToolCall } from "./functions.js";
import prisma from "../../config/db.js";
import dotenv from "dotenv";
import { logger } from "../../utils/logger.js";

dotenv.config();

if (!process.env.GROQ_API_KEY) {
    throw new Error("GROQ_API_KEY is missing from environment variables.");
}

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

interface ToolCall {
    id: string;
    type: "function";
    function: {
        name: string;
        arguments: string;
    };
}

interface ChatMessage {
    role: "system" | "user" | "assistant" | "tool";
    content: string | null;
    tool_calls?: ToolCall[];
    tool_call_id?: string;
    name?: string;
}

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
6. When both 'saveAnalysis' and 'saveMemorySummary' have been successfully called, provide a final summary of your work.

Use the available tools to complete these tasks systematically.
`;

    constructor(model: string = "llama-3.3-70b-versatile") {
        this.model = model;
    }

    async run(): Promise<string> {
        logger.info(`Starting analysis run using model: ${this.model}`);

        // Check for data freshness
        const latestPrice = await prisma.tokenPrice.findFirst({
            orderBy: { lastUpdatedAt: "desc" }
        });

        const latestAnalysis = await prisma.analysis.findFirst({
            orderBy: { createdAt: "desc" }
        });

        if (latestPrice && latestAnalysis) {
            // If the latest price update is NOT newer than our last analysis, skip.
            if (latestPrice.lastUpdatedAt <= latestAnalysis.createdAt) {
                const msg = "No new data since last analysis. Skipping run.";
                logger.info(msg);
                return msg;
            }
        }

        if (!latestPrice) {
            const msg = "No price data found in database. Skipping run.";
            logger.warn(msg);
            return msg;
        }

        // Fetch historical context (memories)
        const memories = await prisma.memory.findMany({
            orderBy: { createdAt: "desc" },
            take: 5
        });

        const memoryContext = memories.length > 0
            ? `Historical Context (Latest Memories):\n${memories.map(m => `- ${m.createdAt.toISOString()}: ${m.summary}`).join('\n')}`
            : "No historical context available.";

        const messages: ChatMessage[] = [
            { role: "system", content: this.systemPrompt },
            { role: "system", content: memoryContext },
            { role: "user", content: "Begin snapshot analysis now." }
        ];

        return await this.executionLoop(messages);
    }

    private async executionLoop(messages: ChatMessage[]): Promise<string> {
        let iterations = 0;

        while (iterations < this.maxIterations) {
            iterations++;
            logger.info(`Iteration ${iterations}...`);

            try {
                // 1. Call model with tool schema
                const response = await groq.chat.completions.create({
                    model: this.model,
                    messages: messages as any,
                    tools: snapshotTools,
                    temperature: 0.2,
                    max_tokens: 2000,
                });

                const message = response.choices[0]?.message;
                if (!message) {
                    throw new Error("Empty LLM response");
                }

                logger.debug("LLM Response", message);

                // Add assistant message to conversation
                messages.push({
                    role: "assistant",
                    content: message.content,
                    tool_calls: message.tool_calls as ToolCall[] | undefined
                });

                // 2. Check for tool calls
                if (message.tool_calls && message.tool_calls.length > 0) {
                    logger.info(`Processing ${message.tool_calls.length} tool call(s)...`);

                    // 3. Execute each tool call
                    for (const toolCall of message.tool_calls) {
                        try {
                            logger.info(`Calling tool: ${toolCall.function.name}`, { arguments: toolCall.function.arguments });

                            // Use the imported executeToolCall function
                            const functionResponse = await executeToolCall(toolCall as ToolCall);

                            logger.info(`Tool result received for ${toolCall.function.name}`);

                            // Add tool result to messages
                            messages.push({
                                role: "tool",
                                tool_call_id: toolCall.id,
                                name: toolCall.function.name,
                                content: functionResponse
                            });
                        } catch (error: any) {
                            logger.error(`Error executing tool ${toolCall.function.name}`, error);

                            // Add error result to messages
                            messages.push({
                                role: "tool",
                                tool_call_id: toolCall.id,
                                name: toolCall.function.name,
                                content: JSON.stringify({ error: error.message })
                            });
                        }
                    }

                    // Continue loop to get next response from model
                    continue;
                }

                // 4. No tool calls, we have a final response
                if (message.content) {
                    logger.info("Final response received.");
                    return message.content;
                }

                throw new Error("LLM response has no content and no tool calls");

            } catch (error: any) {
                logger.error("Error in execution loop", error);
                throw error;
            }
        }

        throw new Error(`Reached maximum iterations (${this.maxIterations}) without a final response.`);
    }
}