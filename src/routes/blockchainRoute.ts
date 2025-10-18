// import express from "express";
// import {
//     // Read operations
//     getUserAllocation,
//     checkHasAllocation,
//     estimateSwap,
//     getTokenBalance,
//     validateRebalanceController,
//     getContractStatus,
//     getBatchAllocationsController,
//
//     // Write operations
//     setAllocation,
//     removeAllocation,
//     revokeApproval,
//     pauseContract,
//     unpauseContract,
//
//
// } from "../controllers/blockchainController.js";
// import authMiddleware, {requireRole} from "../middleware/authMiddleware.js";
//
// const blockchainRouter = express.Router();
//
//
// // READ ROUTES
//
// // Get user's portfolio allocation
// blockchainRouter.get("/allocation/:userAddress", getUserAllocation);
//
// // Check if user has an allocation
// blockchainRouter.get("/has-allocation/:userAddress", checkHasAllocation);
//
// // Get estimated output for a swap
// blockchainRouter.post("/estimate-swap", estimateSwap);
//
// // Get contract balance for a token
// blockchainRouter.get("/balance/:tokenAddress", getTokenBalance);
//
// // Validate a rebalance before execution
// blockchainRouter.post("/validate-rebalance", validateRebalanceController);
//
// // Get contract status (paused, blockchainRouter, owner)
// blockchainRouter.get("/status", getContractStatus);
//
// // Get multiple users' allocations in one call
// blockchainRouter.post("/batch-allocations", getBatchAllocationsController);
//
// // ========================================
// // WRITE ROUTES (Authenticated)
//
// // Set user's portfolio allocation
// blockchainRouter.post("/set-allocation",authMiddleware, setAllocation);
//
// // Remove user's allocation
// blockchainRouter.post("/remove-allocation",authMiddleware, removeAllocation);
//
// // Revoke token approval for blockchainRouter
// blockchainRouter.post("/revoke-approval",authMiddleware, revokeApproval);
//
// // Pause the contract (owner only)
// blockchainRouter.post("/pause",authMiddleware,requireRole(["admin"]), pauseContract);
//
// // Unpause the contract (owner only)
// blockchainRouter.post("/unpause",requireRole(["admin"]), unpauseContract);
//
// export default blockchainRouter;