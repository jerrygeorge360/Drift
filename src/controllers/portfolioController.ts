import { Request, Response } from "express";
import {createPortfolio, getPortfolioBySmartAccountId, updatePortfolioName} from "../utils/dbhelpers.js";

// ✅ Get portfolio by smartAccountId
export const getPortfolioController = async (req: Request, res: Response) => {
    const { smartAccountId } = req.params;

    if (!smartAccountId) {
        return res.status(400).json({ error: "smartAccountId is required" });
    }

    const portfolio = await getPortfolioBySmartAccountId(smartAccountId);

    if (!portfolio) {
        return res.status(404).json({ error: "Portfolio not found" });
    }

    res.status(200).json({ success: true, data: portfolio });
};

// ✅ Update portfolio name
export const updatePortfolioNameController = async (req: Request, res: Response) => {
    const { smartAccountId } = req.params;
    const { newName } = req.body;

    if (!smartAccountId) {
        return res.status(400).json({ error: "smartAccountId is required" });
    }

    if (!newName || typeof newName !== "string" || newName.trim().length < 2) {
        return res.status(400).json({ error: "A valid newName is required" });
    }

    const updatedPortfolio = await updatePortfolioName(smartAccountId, newName.trim());

    res.status(200).json({
        success: true,
        message: "Portfolio name updated successfully",
        data: updatedPortfolio,
    });
};


export const createPortfolioController = async (req: Request, res: Response) => {
    const { smartAccountId, name } = req.body;

    if (!smartAccountId || typeof smartAccountId !== "string") {
        return res.status(400).json({ error: "smartAccountId is required" });
    }

    if (!name || typeof name !== "string" || name.trim().length < 2) {
        return res.status(400).json({ error: "A valid portfolio name is required" });
    }

    // Prevent duplicates (since each smartAccount can have only one portfolio)
    const existing = await getPortfolioBySmartAccountId(smartAccountId);
    if (existing) {
        return res.status(400).json({ error: "Portfolio already exists for this smart account" });
    }

    const newPortfolio = await createPortfolio(smartAccountId, name.trim());

    res.status(201).json({
        success: true,
        message: "Portfolio created successfully",
        data: newPortfolio,
    });
};