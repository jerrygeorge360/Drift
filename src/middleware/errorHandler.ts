import { Request, Response, NextFunction } from "express";
import { logger } from "../utils/logger.js";

export default function errorHandler(
    err: any,
    req: Request,
    res: Response,
    next: NextFunction
) {
    logger.error("Unhandled Error", err);
    res.status(500).json({ error: "Internal Server Error" });
}