
export const snapshotTools = [
    {
        type: "function",
        function: {
            name: "getLatestEntries",
            description: "Fetch the latest N token price entries from the database.",
            parameters: {
                type: "object",
                properties: {
                    limit: {
                        type: "number",
                        description: "Number of entries to fetch (default: 10)."
                    },
                    symbols: {
                        type: "array",
                        items: { type: "string" },
                        description: "Optional list of token symbols to filter by."
                    }
                }
            }
        }
    },
    {
        type: "function",
        function: {
            name: "saveAnalysis",
            description: "Save the full analysis text into the database.",
            parameters: {
                type: "object",
                properties: {
                    analysis: {
                        type: "string",
                        description: "The full analysis text to save."
                    }
                },
                required: ["analysis"]
            }
        }
    },
    {
        type: "function",
        function: {
            name: "saveMemorySummary",
            description: "Store a memory summary including token prices and an abridged analysis.",
            parameters: {
                type: "object",
                properties: {
                    priceTokenText: {
                        type: "string",
                        description: "Token price information as text."
                    },
                    abridgedAnalysis: {
                        type: "string",
                        description: "An abridged version of the full analysis."
                    }
                },
                required: ["priceTokenText", "abridgedAnalysis"]
            }
        }
    },
    {
        type: "function",
        function: {
            name: "getLatestMemories",
            description: "Fetch the latest N memory summaries for historical context.",
            parameters: {
                type: "object",
                properties: {
                    limit: {
                        type: "number",
                        description: "Number of memories to fetch (default: 5)."
                    }
                }
            }
        }
    }
];