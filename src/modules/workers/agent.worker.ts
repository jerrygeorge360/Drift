import { Worker } from "bullmq";
import { Redis } from "ioredis";
import { SnapshotAgent } from "../agent/agent.js";

// Redis connection for the worker
const connection = new Redis({
    host: process.env.REDIS_HOST || "127.0.0.1",
    port: Number(process.env.REDIS_PORT) || 6379,
    maxRetriesPerRequest: null,
});

export const agentWorker = new Worker(
    "ai-agent-queue",
    async (job) => {
        console.log(`[AgentWorker] Processing job #${job.id}...`);

        try {
            const agent = new SnapshotAgent();
            const result = await agent.run();

            console.log(`[AgentWorker] Job #${job.id} completed.`);
            return result;
        } catch (error: any) {
            console.error(`[AgentWorker] Error in job #${job.id}:`, error.message);
            throw error;
        }
    },
    {
        connection,
        concurrency: 2, // Adjust based on resources
    }
);

agentWorker.on("completed", (job) => {
    console.log(`[AgentWorker] Job #${job.id} marked as completed.`);
});

agentWorker.on("failed", (job, err) => {
    console.error(`[AgentWorker] Job #${job?.id} failed:`, err.message);
});

console.log("[AgentWorker] Worker initialized and listening for jobs...");
