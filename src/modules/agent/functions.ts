
import prisma from "../../config/db.js";

export const snapshotToolExecutors = {
    getLatestEntries: async ({ limit = 10, symbols }: { limit?: number, symbols?: string[] }) => {
        const entries = await prisma.tokenPrice.findMany({
            where: symbols ? { symbol: { in: symbols.map(s => s.toUpperCase()) } } : undefined,
            orderBy: { lastUpdatedAt: "desc" },
            take: limit
        });
        return JSON.stringify(entries);
    },
    
    saveAnalysis: async ({ analysis }: { analysis: string }) => {
        const result = await prisma.analysis.create({
            data: { text: analysis }
        });
        return JSON.stringify({ success: true, id: result.id });
    },
    
    saveMemorySummary: async ({ priceTokenText, abridgedAnalysis }: { priceTokenText: string, abridgedAnalysis: string }) => {
        const result = await prisma.memory.create({
            data: {
                text: priceTokenText,
                summary: abridgedAnalysis
            }
        });
        return JSON.stringify({ success: true, id: result.id });
    },
    
    getLatestMemories: async ({ limit = 5 }: { limit?: number }) => {
        const memories = await prisma.memory.findMany({
            orderBy: { createdAt: "desc" },
            take: limit
        });
        return JSON.stringify(memories);
    }
};


export const availableFunctions = {
    getLatestEntries: snapshotToolExecutors.getLatestEntries,
    saveAnalysis: snapshotToolExecutors.saveAnalysis,
    saveMemorySummary: snapshotToolExecutors.saveMemorySummary,
    getLatestMemories: snapshotToolExecutors.getLatestMemories,

};

export async function executeToolCall(toolCall: any) {
    /**
     * Parse and execute a single tool call
     */
    const functionName = toolCall.function.name;
    const functionToCall = availableFunctions[functionName as keyof typeof availableFunctions];
    
    if (!functionToCall) {
        throw new Error(`Function ${functionName} not found in available functions`);
    }
    
    const functionArgs = JSON.parse(toolCall.function.arguments);
    
    // Call the function with unpacked arguments
    return await functionToCall(functionArgs);
}

