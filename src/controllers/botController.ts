import { Request, Response } from "express";
import {
    createBot,
    getAllBots,
    getBotById,
    updateBot,
    deleteBot,
} from "../utils/dbhelpers.js";
import {runAIAgent} from "../modules/bot/bot.agent.js";

// Create a new bot
export async function createBotController(req: Request, res: Response) {
    try {
        const { name, description, privateKey, status } = req.body;

        if (!name || !privateKey) {
            return res.status(400).json({ message: "Missing name or privateKey" });
        }

        const bot = await createBot({ name, description, privateKey, status });
        res.status(201).json(bot);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
}

// Get all bots
export async function getAllBotsController(req: Request, res: Response) {
    try {
        const bots = await getAllBots();
        res.status(200).json(bots);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
}

// Get bot by ID (withPrivateKey via query param)
export async function getBotByIdController(req: Request, res: Response) {
    try {
        const { id } = req.params;
        const withPrivateKey = req.query.withPrivateKey === "true";

        const bot = await getBotById(id, withPrivateKey);
        if (!bot) return res.status(404).json({ message: "Bot not found" });

        res.status(200).json(bot);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
}

// Update bot info
export async function updateBotController(req: Request, res: Response) {
    try {
        const { id } = req.params;
        const { name, description, privateKey, status } = req.body;

        const bot = await updateBot(id, { name, description, privateKey, status });
        res.status(200).json(bot);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
}

// Delete bot
export async function deleteBotController(req: Request, res: Response) {
    try {
        const { id } = req.params;
        await deleteBot(id);
        res.status(200).json({ message: "Bot deleted successfully" });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
}



export async function runAgentController(req: Request, res: Response) {
    const { botName, smartAccountId } = req.body;

    try {
        const result = await runAIAgent(botName, smartAccountId);
        res.status(200).json(result);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
}
