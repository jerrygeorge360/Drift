import { Queue, Worker } from "bullmq";
import { Redis } from "ioredis";
import { runAIAgent } from "../bot/bot.agent.js";

const connection = new Redis(process.env.REDIS_URL || "redis://localhost:6379");

// Create queue
export const agentQueue = new Queue("ai-agent-queue", {
    connection,
    defaultJobOptions: {
        attempts: 3, // automatic retries
        backoff: { type: "exponential", delay: 1000 },
        removeOnComplete: 1000,
        removeOnFail: 1000,
    },
});

// Create worker — processes jobs
export const agentWorker = new Worker(
    "ai-agent-queue",
    async (job) => {
        const { botName, smartAccountId, marketData, agentMode } = job.data;
        console.log(`👷‍♂️ Processing AI Agent job for ${smartAccountId} (${botName})...`);

        return await runAIAgent(botName, smartAccountId, marketData, agentMode);
    },
    {
        connection,
        concurrency: 5, // how many jobs run in parallel
    }
);

// Handle worker events
agentWorker.on("completed", (job, result) => {
    console.log(`✅ Job ${job.id} completed`, result?.status || "done");
});

agentWorker.on("failed", (job, err) => {
    console.error(`❌ Job ${job?.id} failed:`, err?.message);
});
