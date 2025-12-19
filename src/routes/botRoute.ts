import express from "express";
import {
    createBotController,
    getAllBotsController,
    getBotByIdController,
    updateBotController,
    deleteBotController,
} from "../controllers/botController.js";

const botRouter = express.Router();

// POST /api/bots
botRouter.post("/", createBotController);

// GET /api/bots
botRouter.get("/", getAllBotsController);

// GET /api/bots/:id
botRouter.get("/:id", getBotByIdController);

// PATCH /api/bots/:id
botRouter.patch("/:id", updateBotController);

// DELETE /api/bots/:id
botRouter.delete("/:id", deleteBotController);

export default botRouter;
