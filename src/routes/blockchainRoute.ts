import express from "express";
import {
    // Read operations
    getUserAllocation,
    checkHasAllocation,
    estimateSwap,
    getContractStatus,
} from "../controllers/blockchainController.js";

const blockchainRouter = express.Router();


// READ ROUTES

// Get user's portfolio allocation
blockchainRouter.get("/allocation/:userAddress", getUserAllocation);

// Check if user has an allocation
blockchainRouter.get("/has-allocation/:userAddress", checkHasAllocation);

// Get estimated output for a swap
blockchainRouter.post("/estimate-swap", estimateSwap);


// Get contract status (paused, blockchainRouter, owner)
blockchainRouter.get("/status", getContractStatus);


export default blockchainRouter;