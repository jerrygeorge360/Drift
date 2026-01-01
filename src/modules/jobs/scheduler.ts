import { agentQueue } from "./agentQueue.js";
import { logger } from "../../utils/logger.js";

/**
 * Initializes repeatable jobs for the AI agent.
 * Adds the job to the queue.
 */
export const initScheduler = async () => {
    logger.info("[Scheduler] Initializing repeatable jobs...");

    try {
        await agentQueue.add(
            "run-global-agent",
            {},
            {
                repeat: { pattern: "*/1 * * * *" },
                jobId: "global-agent"
            }
        );
        logger.info("[Scheduler] Global agent job scheduled (every 1 minute).");
    } catch (error: any) {
        logger.error("[Scheduler] Failed to schedule global agent job", error);
    }
};

// Run initialization
initScheduler();
