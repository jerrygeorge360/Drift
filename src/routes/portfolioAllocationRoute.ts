import express from "express";
import {
    deleteAllAllocations,
    deleteSingleAllocation,
    getAllocations,
    updateAllocations
} from "../controllers/portfolioAllocationController.js";


const portfolioAllocationRouter = express.Router();

// GET allocations for a portfolio
portfolioAllocationRouter.get("/:portfolioId", getAllocations);

// POST to set new allocations (replaces existing)
portfolioAllocationRouter.post("/:portfolioId", updateAllocations);

portfolioAllocationRouter.delete("/:portfolioId/:tokenId", deleteSingleAllocation);

// DELETE all allocations for a portfolio
portfolioAllocationRouter.delete("/:portfolioId", deleteAllAllocations);

export default portfolioAllocationRouter;
