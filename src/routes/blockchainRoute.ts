import express from "express";
import {
    // Read operations
    getUserAllocation,
    checkHasAllocation,
    estimateSwap,
    getTokenBalance,
    validateRebalanceController,
    getContractStatus,
    getBatchAllocationsController,

    // Write operations
    setAllocation,
    removeAllocation,
    revokeApproval,
    pauseContract,
    unpauseContract,


} from "../controllers/blockchainController.js";
import authMiddleware, {requireRole} from "../middleware/authMiddleware.js";

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



