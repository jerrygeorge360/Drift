import express from "express";
import {
    createConfig,
    getConfigByAddress,
    getAllConfigs,
    togglePause,
    deleteConfig,
} from "../controllers/contractConfigController.js";

const contractConfigRouter = express.Router();

// POST /api/contracts
contractConfigRouter.post("/", createConfig);

// GET /api/contracts
contractConfigRouter.get("/", getAllConfigs);

// GET /api/contracts/:address
contractConfigRouter.get("/:address", getConfigByAddress);

// PATCH /api/contracts/:address/pause
contractConfigRouter.patch("/:address/pause", togglePause);

// DELETE /api/contracts/:address
contractConfigRouter.delete("/:address", deleteConfig);

export default contractConfigRouter;
