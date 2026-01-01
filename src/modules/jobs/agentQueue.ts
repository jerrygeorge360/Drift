import { Queue } from "bullmq";
import { Redis } from "ioredis";
import { logger } from "../../utils/logger.js";

const connection = new Redis({
    host: process.env.REDIS_HOST || "127.0.0.1",
    port: Number(process.env.REDIS_PORT) || 6379,
    maxRetriesPerRequest: null,
});

connection.on('error', (err) => logger.error('Redis error', err));

export const agentQueue = new Queue("ai-agent-queue", {
    connection,
    defaultJobOptions: {
        attempts: 3,
        backoff: { type: "exponential", delay: 1000 },
        removeOnComplete: { count: 100, age: 24 * 3600 },
        removeOnFail: { count: 100, age: 7 * 24 * 3600 },
    },
});

// one off job
export const addAgentJob = async (data: any) => {
    try {
        const job = await agentQueue.add('process-agent', data);
        logger.info(`[AgentQueue] Job #${job.id} added.`);
        return job;
    } catch (error: any) {
        logger.error('[AgentQueue] Error adding job', error);
        throw error;
    }
};