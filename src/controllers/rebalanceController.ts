import {Request, Response} from "express";
import {
    getRebalanceLogs,
    createRebalanceLog
} from "../utils/dbhelpers.js";

// Create new rebalance log
export const createRebalanceLogController = async (req:Request, res:Response) => {
    const { portfolioId, tokenInId, tokenOutId, amountIn, amountOut, reason, executor } = req.body;

    if (!portfolioId || !tokenInId || !tokenOutId) {
        return res.status(400).json({ error: "portfolioId, tokenInId, and tokenOutId are required" });
    }

    if (isNaN(amountIn) || isNaN(amountOut)) {
        return res.status(400).json({ error: "amountIn and amountOut must be numbers" });
    }

    const log = await createRebalanceLog({
        portfolioId,
        tokenInId,
        tokenOutId,
        amountIn: Number(amountIn),
        amountOut: Number(amountOut),
        reason: reason || "Manual Rebalance",
        executor: executor || "System",
    });

    res.status(201).json({ success: true, data: log });
};

// Get all rebalance logs for a portfolio
export const getRebalanceLogsController = async (req:Request, res:Response) => {
    const { portfolioId } = req.params;

    const logs = await getRebalanceLogs(portfolioId);

    res.json({ success: true, count: logs.length, data: logs });
};
