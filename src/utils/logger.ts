import { Request, Response, NextFunction } from "express";
import { Prisma } from "@prisma/client";
import fs from "fs";
import path from "path";

// ------------------ Setup ------------------ //
const logDir = path.join(__dirname, "..", "logs");
if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir);
}

function getLogFilePath() {
    const today = new Date().toISOString().split("T")[0]; // "2025-10-01"
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

    const errorMessage = `[${now}] ERROR in ${req.method} ${req.originalUrl} - ${
        err.message || err
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

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
        errorMessage += `Code ${error.code} | ${error.message}\n`;
    } else if (error instanceof Prisma.PrismaClientValidationError) {
        errorMessage += `Validation Error | ${error.message}\n`;
    } else if (error instanceof Prisma.PrismaClientRustPanicError) {
        errorMessage += `Rust Panic | ${error.message}\n`;
    } else if (error instanceof Prisma.PrismaClientInitializationError) {
        errorMessage += `Initialization Error | ${error.message}\n`;
    } else if (error instanceof Prisma.PrismaClientUnknownRequestError) {
        errorMessage += `Unknown Request Error | ${error.message}\n`;
    } else {
        errorMessage += `${error.message || error}\n`;
    }

    console.error(errorMessage.trim());
    writeLog(errorMessage);
}
