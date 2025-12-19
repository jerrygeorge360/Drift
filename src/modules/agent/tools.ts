import prisma from "../../config/db.js";

export const snapshotTools = {
    getLatestEntries: {
        name: "getLatestEntries",
        description: "Fetch the latest N token price entries from the database.",
        parameters: {
            type: "object",
            properties: {
                limit: { type: "number", description: "Number of entries to fetch (default: 10)." },
                symbols: {
                    type: "array",
                    items: { type: "string" },
                    description: "Optional list of token symbols to filter by."
                }
            }
        },
        execute: async ({ limit = 10, symbols }: { limit?: number, symbols?: string[] }) => {
            const entries = await prisma.tokenPrice.findMany({
                where: symbols ? { symbol: { in: symbols.map(s => s.toUpperCase()) } } : undefined,
                orderBy: { lastUpdatedAt: "desc" },
                take: limit
            });
            return JSON.stringify(entries);
        }
    },

    saveAnalysis: {
        name: "saveAnalysis",
        description: "Save the full analysis text into the database.",
        parameters: {
            type: "object",
            properties: {
                analysis: { type: "string", description: "The full analysis text to save." }
            },
            required: ["analysis"]
        },
        execute: async ({ analysis }: { analysis: string }) => {
            const result = await prisma.analysis.create({
                data: { text: analysis }
            });
            return JSON.stringify({ success: true, id: result.id });
        }
    },

    saveMemorySummary: {
        name: "saveMemorySummary",
        description: "Store a memory summary including token prices and an abridged analysis.",
        parameters: {
            type: "object",
            properties: {
                priceTokenText: { type: "string", description: "Token price information as text." },
                abridgedAnalysis: { type: "string", description: "An abridged version of the full analysis." }
            },
            required: ["priceTokenText", "abridgedAnalysis"]
        },
        execute: async ({ priceTokenText, abridgedAnalysis }: { priceTokenText: string, abridgedAnalysis: string }) => {
            const result = await prisma.memory.create({
                data: {
                    text: priceTokenText,
                    summary: abridgedAnalysis
                }
            });
            return JSON.stringify({ success: true, id: result.id });
        }
    },
    getLatestMemories: {
        name: "getLatestMemories",
        description: "Fetch the latest N memory summaries for historical context.",
        parameters: {
            type: "object",
            properties: {
                limit: { type: "number", description: "Number of memories to fetch (default: 5)." }
            }
        },
        execute: async ({ limit = 5 }: { limit?: number }) => {
            const memories = await prisma.memory.findMany({
                orderBy: { createdAt: "desc" },
                take: limit
            });
            return JSON.stringify(memories);
        }
    }
};


