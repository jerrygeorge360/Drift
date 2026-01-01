import { Request, Response, NextFunction } from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import {
    PrismaClientKnownRequestError,
    PrismaClientValidationError,
    PrismaClientRustPanicError,
    PrismaClientInitializationError,
    PrismaClientUnknownRequestError,
} from "@prisma/client/runtime/library";

// ------------------ ESM Compatibility ------------------ //
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ------------------ Setup ------------------ //
const logDir = path.join(__dirname, "..", "logs");
if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
}

function getLogFilePath() {
    const today = new Date().toISOString().split("T")[0]; // e.g. "2025-10-11"
    return path.join(logDir, `app-${today}.log`);
}

function writeLog(message: string) {
    fs.appendFile(getLogFilePath(), message, (err) => {
        if (err) console.error("Failed to write log:", err);
    });
}

// ------------------ Request Logger ------------------ //
export function requestLogger(req: Request, res: Response, next: NextFunction) {
    const start = Date.now();

    res.on("finish", () => {
        const duration = Date.now() - start;
        const now = new Date().toISOString();

        const logMessage = `[${now}] ${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms\n`;

        console.log(logMessage.trim());
        writeLog(logMessage);
    });

    next();
}

// ------------------ Error Logger ------------------ //
export function errorLogger(
    err: any,
    req: Request,
    res: Response,
    next: NextFunction
) {
    const now = new Date().toISOString();

    const errorMessage = `[${now}] ERROR in ${req.method} ${req.originalUrl} - ${err.message || err
        }\nStack: ${err.stack || "No stack trace"}\n`;

    console.error(errorMessage.trim());
    writeLog(errorMessage);

    res.status(500).json({ error: "Internal Server Error" });
}

// ------------------ Async Handler ------------------ //
export function asyncHandler(
    fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) {
    return (req: Request, res: Response, next: NextFunction) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
}

// ------------------ Prisma Error Logger ------------------ //
export function logPrismaError(error: any) {
    const now = new Date().toISOString();
    let errorMessage = `[${now}] PRISMA ERROR - `;

    if (error instanceof PrismaClientKnownRequestError) {
        errorMessage += `Known Request Error (Code ${error.code}): ${error.message}\n`;
    } else if (error instanceof PrismaClientValidationError) {
        errorMessage += `Validation Error: ${error.message}\n`;
    } else if (error instanceof PrismaClientRustPanicError) {
        errorMessage += `Rust Panic: ${error.message}\n`;
    } else if (error instanceof PrismaClientInitializationError) {
        errorMessage += `Initialization Error: ${error.message}\n`;
    } else if (error instanceof PrismaClientUnknownRequestError) {
        errorMessage += `Unknown Request Error: ${error.message}\n`;
    } else {
        errorMessage += `${error.message || error}\n`;
    }

    console.error(errorMessage.trim());
    writeLog(errorMessage);
}

// ------------------ Colors ------------------ //
const COLORS = {
    reset: "\x1b[0m",
    bright: "\x1b[1m",
    dim: "\x1b[2m",
    info: "\x1b[36m",    // Cyan
    warn: "\x1b[33m",    // Yellow
    error: "\x1b[31m",   // Red
    debug: "\x1b[35m",   // Magenta
    timestamp: "\x1b[90m", // Gray
    caller: "\x1b[32m",   // Green
};

// ------------------ Helper ------------------ //
function getCallerInfo() {
    const error = new Error();
    const stack = error.stack?.split("\n");
    if (!stack || stack.length < 4) return "unknown";

    const callerLine = stack[3];
    const match = callerLine.match(/at\s+(.*)\s+\((.*):(\d+):(\d+)\)/) ||
        callerLine.match(/at\s+(.*):(\d+):(\d+)/);

    if (match) {
        const filePath = match[2] || match[1];
        const line = match[3] || match[2];
        const fileName = path.basename(filePath);
        return `${fileName}:${line}`;
    }

    return "unknown";
}

function formatArgs(args: any[]) {
    if (args.length === 0) return "";
    return args.map(arg =>
        typeof arg === 'object' ? `\n${JSON.stringify(arg, null, 2)}` : String(arg)
    ).join(" ");
}

// ------------------ Generic Logger ------------------ //
export const logger = {
    info: (message: string, ...args: any[]) => {
        const now = new Date().toISOString();
        const caller = getCallerInfo();
        const paddedCaller = `[${caller}]`.padEnd(25);

        // Console (with colors)
        console.log(
            `${COLORS.timestamp}${now}${COLORS.reset} ` +
            `${COLORS.caller}${paddedCaller}${COLORS.reset} ` +
            `${COLORS.info}INFO${COLORS.reset}: ${message}`,
            ...args
        );

        // File (clean)
        const logMessage = `[${now}] [${caller}] INFO: ${message} ${formatArgs(args)}\n`;
        writeLog(logMessage);
    },
    warn: (message: string, ...args: any[]) => {
        const now = new Date().toISOString();
        const caller = getCallerInfo();
        const paddedCaller = `[${caller}]`.padEnd(25);

        // Console (with colors)
        console.warn(
            `${COLORS.timestamp}${now}${COLORS.reset} ` +
            `${COLORS.caller}${paddedCaller}${COLORS.reset} ` +
            `${COLORS.warn}WARN${COLORS.reset}: ${message}`,
            ...args
        );

        // File (clean)
        const logMessage = `[${now}] [${caller}] WARN: ${message} ${formatArgs(args)}\n`;
        writeLog(logMessage);
    },
    error: (message: string, error?: any, ...args: any[]) => {
        const now = new Date().toISOString();
        const caller = getCallerInfo();
        const paddedCaller = `[${caller}]`.padEnd(25);

        // Console (with colors)
        console.error(
            `${COLORS.timestamp}${now}${COLORS.reset} ` +
            `${COLORS.caller}${paddedCaller}${COLORS.reset} ` +
            `${COLORS.error}ERROR${COLORS.reset}: ${message}`,
            error || "",
            ...args
        );

        // File (clean)
        let logMessage = `[${now}] [${caller}] ERROR: ${message} ${formatArgs(args)}\n`;
        if (error) {
            logMessage += `Details: ${error.message || error}\n`;
            if (error.stack) logMessage += `Stack: ${error.stack}\n`;
        }
        writeLog(logMessage);
    },
    debug: (message: string, ...args: any[]) => {
        if (process.env.NODE_ENV === "development" || true) { // Force for now to show user
            const now = new Date().toISOString();
            const caller = getCallerInfo();
            const paddedCaller = `[${caller}]`.padEnd(25);

            // Console (with colors)
            console.debug(
                `${COLORS.timestamp}${now}${COLORS.reset} ` +
                `${COLORS.caller}${paddedCaller}${COLORS.reset} ` +
                `${COLORS.debug}DEBUG${COLORS.reset}: ${message}`,
                ...args
            );

            // File (clean)
            const logMessage = `[${now}] [${caller}] DEBUG: ${message} ${formatArgs(args)}\n`;
            writeLog(logMessage);
        }
    }
};
