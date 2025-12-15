import { Queue, Worker } from "bullmq";
import { Redis } from "ioredis";
import { runAIAgent } from "../bot/bot.agent.js";

// Create Redis connection with error handling
const connection = new Redis({
    host: "127.0.0.1",
    port: 6379,
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
});

// Redis connection event handlers
connection.on('error', (err) => {
    console.error('❌ Redis connection error:', err.message);
});

connection.on('connect', () => {
    console.log('✅ Redis connected successfully');
});

connection.on('ready', () => {
    console.log('✅ Redis ready to accept commands');
});

connection.on('reconnecting', () => {
    console.log('🔄 Redis reconnecting...');
});

// Create queue with enhanced configuration
export const agentQueue = new Queue("ai-agent-queue", {
    connection,
    defaultJobOptions: {
        attempts: 3,
        backoff: {
            type: "exponential",
            delay: 1000
        },
        removeOnComplete: {
            count: 1000, // Keep last 1000 completed jobs
            age: 24 * 3600, // Keep for 24 hours
        },
        removeOnFail: {
            count: 1000, // Keep last 1000 failed jobs
            age: 7 * 24 * 3600, // Keep for 7 days (for debugging)
        },
    },
});

// Queue event handlers
agentQueue.on('error', (err) => {
    console.error('❌ Queue error:', err.message);
});


// Validate job data
const validateJobData = (data: any) => {
    const { botName, smartAccountId, marketData, agentMode } = data;
    console.log(`validateJobData:`, data);
    if (!smartAccountId || typeof smartAccountId !== 'string') {
        throw new Error('Invalid or missing smartAccountId');
    }

    if (!botName || typeof botName !== 'string') {
        throw new Error('Invalid or missing botName');
    }

    // ✅ Fixed: Include all valid agent modes
    if (agentMode && !['auto', 'manual', 'test', 'smart', 'urgent'].includes(agentMode)) {
        console.warn(`⚠️ Unknown agentMode: ${agentMode}`);
    }

    return true;
};
// Create worker with enhanced error handling
export const agentWorker = new Worker("ai-agent-queue", async job => {
       console.log(job)// should print out 'process-agent'

        const startTime = Date.now();
        const { botName, smartAccountId,delegationId ,marketData, agentMode,currentWeights,recentRebalances,totalValue } = job.data;


        try {
            // Validate job data
            // validateJobData(job.data);

            console.log(`👷‍♂️ Processing AI Agent job #${job.id} for ${smartAccountId} (${botName})...`);

            // Update job progress (optional)
            await job.updateProgress(10);

            // Run the AI agent
            const result = await runAIAgent(botName, smartAccountId,delegationId, marketData, agentMode,currentWeights,recentRebalances,totalValue);

            await job.updateProgress(100);

            const duration = Date.now() - startTime;
            console.log(`✅ Job #${job.id} completed in ${duration}ms`);

            return result;

        } catch (error: any) {
            console.error(`❌ Error processing job #${job.id}:`, {
                error: error.message,
                smartAccountId,
                botName,
                attemptsMade: job.attemptsMade,
            });

            // Re-throw to let BullMQ handle retries
            throw error;
        }
    },
    {
        connection,
        concurrency: 5,
        limiter: {
            max: 100, // Max 100 jobs
            duration: 60000, // Per 60 seconds (rate limiting)
        },
    }
);

// Worker event handlers
agentWorker.on("completed", (job, result) => {
    console.log(`✅ Job #${job.id} completed successfully`, {
        status: result?.status || "done",
        smartAccountId: job.data?.smartAccountId,
        botName: job.data?.botName,
    });
});

agentWorker.on("failed", (job, err) => {
    console.error(`❌ Job #${job?.id} failed:`, {
        error: err?.message,
        stack: process.env.NODE_ENV === 'development' ? err?.stack : undefined,
        data: {
            smartAccountId: job?.data?.smartAccountId,
            botName: job?.data?.botName,
        },
        attemptsMade: job?.attemptsMade,
        attemptsTotal: job?.opts?.attempts,
    });
});

agentWorker.on("progress", (job, progress) => {
    console.log(`📊 Job #${job.id} progress: ${progress}%`);
});

agentWorker.on("active", (job) => {
    console.log(`🔄 Job #${job.id} started processing`);
});

agentWorker.on("stalled", (jobId) => {
    console.warn(`⚠️ Job #${jobId} stalled`);
});

// Graceful shutdown handler
const gracefulShutdown = async (signal: string) => {
    console.log(`\n⏸️ ${signal} received, starting graceful shutdown...`);

    try {
        // Stop accepting new jobs
        console.log('🛑 Pausing queue...');
        await agentQueue.pause();

        // Close worker (waits for active jobs to complete)
        console.log('⏳ Waiting for active jobs to complete...');
        await agentWorker.close();

        // Close queue
        await agentQueue.close();

        // Close Redis connection
        console.log('🔌 Closing Redis connection...');
        await connection.quit();

        console.log('✅ Graceful shutdown completed');
        process.exit(0);
    } catch (error: any) {
        console.error('❌ Error during shutdown:', error.message);
        process.exit(1);
    }
};

// Register shutdown handlers
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught errors
process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
    console.error('❌ Uncaught Exception:', error);
    gracefulShutdown('UNCAUGHT_EXCEPTION');
});

// Export helper function to add jobs
export const addAgentJob = async (
    botName: string, smartAccountId: string, marketData: any, agentMode?: string, currentWeights?: any, recentRebalances?: any, totalValue?: any) => {
    try {
        console.log(botName, smartAccountId, marketData, agentMode,currentWeights,recentRebalances,totalValue)
        const job = await agentQueue.add(
            'process-agent', // Job name
            { botName, smartAccountId, marketData, agentMode,currentWeights,recentRebalances,totalValue},

        );
        console.log(totalValue)
        console.log(`📝 Job #${job.id} added to queue`);
        return job;
    } catch (error: any) {
        console.error('❌ Error adding job to queue:', error.message);
        throw error;
    }
};

// Export helper function to get queue stats
export const getQueueStats = async () => {
    try {
        const [waiting, active, completed, failed, delayed] = await Promise.all([
            agentQueue.getWaitingCount(),
            agentQueue.getActiveCount(),
            agentQueue.getCompletedCount(),
            agentQueue.getFailedCount(),
            agentQueue.getDelayedCount(),
        ]);

        return {
            waiting,
            active,
            completed,
            failed,
            delayed,
            total: waiting + active + completed + failed + delayed,
        };
    } catch (error: any) {
        console.error('❌ Error getting queue stats:', error.message);
        throw error;
    }
};

const c =await getQueueStats()
// console.log(c);