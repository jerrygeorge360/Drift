import dotenv from "dotenv";
import "./modules/workers/agent.worker.js";

dotenv.config();

console.log("[WorkerProcess] Background workers started and listening...");

// Handle graceful shutdown
const handleShutdown = async (signal: string) => {
    console.log(`\n[${signal}] Shutting down background workers...`);
    // BullMQ workers handle their own connection closing if configured, 
    // but you can add explicit close calls here if needed.
    process.exit(0);
};

process.on("SIGINT", () => handleShutdown("SIGINT"));
process.on("SIGTERM", () => handleShutdown("SIGTERM"));
