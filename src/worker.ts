import dotenv from "dotenv";
import { logger } from "./utils/logger.js";

dotenv.config();

import "./modules/workers/agent.worker.js";

logger.info("[WorkerProcess] Background workers started and listening...");

// Handle graceful shutdown
const handleShutdown = async (signal: string) => {
    logger.info(`\n[${signal}] Shutting down background workers...`);
    // BullMQ workers handle their own connection closing if configured, 
    // but you can add explicit close calls here if needed.
    process.exit(0);
};

process.on("SIGINT", () => handleShutdown("SIGINT"));
process.on("SIGTERM", () => handleShutdown("SIGTERM"));


// DONE: Redeploy my contracts
// TODO: Fix envio