import { Worker } from "bullmq";
import { Redis } from "ioredis";
import { SnapshotAgent } from "../agent/agent.js";
import { logger } from "../../utils/logger.js";

// Redis connection for the worker
const connection = new Redis({
    host: process.env.REDIS_HOST || "127.0.0.1",
    port: Number(process.env.REDIS_PORT) || 6379,
    maxRetriesPerRequest: null,
});

connection.on("connect", () => {
    logger.info(`[AgentWorker] Connected to Redis at ${connection.options.host}:${connection.options.port}`);
});

connection.on("error", (err) => {
    logger.error("[AgentWorker] Redis connection error", err);
});

export const agentWorker = new Worker(
    "ai-agent-queue",
    async (job) => {
        logger.info(`[AgentWorker] Processing job #${job.id}...`);

        try {
            const agent = new SnapshotAgent();
            const result = await agent.run();

            logger.info(`[AgentWorker] Job #${job.id} completed.`);
            return result;
        } catch (error: any) {
            logger.error(`[AgentWorker] Error in job #${job.id}`, error);
            throw error;
        }
    },
    {
        connection,
        concurrency: 2, // Adjust based on resources
    }
);

agentWorker.on("completed", (job) => {
    logger.info(`[AgentWorker] Job #${job.id} marked as completed.`);
});

agentWorker.on("failed", (job, err) => {
    logger.error(`[AgentWorker] Job #${job?.id} failed`, err);
});

logger.info("[AgentWorker] Worker initialized and listening for jobs...");
