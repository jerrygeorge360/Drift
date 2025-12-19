import { agentQueue } from "./agentQueue.js";

/**
 * Initializes repeatable jobs for the AI agent.
 */
export const initScheduler = async () => {
    console.log("[Scheduler] Initializing repeatable jobs...");

    try {
        await agentQueue.add(
            "run-global-agent",
            {},
            {
                repeat: { pattern: "*/15 * * * *" },
                jobId: "global-agent"
            }
        );
        console.log("[Scheduler] Global agent job scheduled (every 15 minutes).");
    } catch (error: any) {
        console.error("[Scheduler] Failed to schedule global agent job:", error.message);
    }
};

// Run initialization
initScheduler();
