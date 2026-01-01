import dotenv from "dotenv";
import { startPricePolling, stopPricePolling } from "./utils/oracle.service.js";
import { logger } from "./utils/logger.js";

// Load environment variables
dotenv.config();

logger.info("Starting Oracle Poller Service...");

// Start the polling service
startPricePolling();

// Handle graceful shutdown
const handleShutdown = (signal: string) => {
    logger.info(`\n[${signal}] Shutting down Oracle Poller Service...`);
    stopPricePolling();
    process.exit(0);
};

process.on('SIGINT', () => handleShutdown('SIGINT'));
process.on('SIGTERM', () => handleShutdown('SIGTERM'));

// Keep the process alive
process.stdin.resume();
