import { Request, Response } from 'express';

// ✅ GET /api/allocations/:portfolioId
import {
    deleteAllPortfolioAllocations,
    deletePortfolioAllocation,
    getPortfolioAllocations,
    setPortfolioAllocations
} from "../utils/dbhelpers.js";
import prisma from "../config/db.js";
import { logger } from "../utils/logger.js";

export async function getAllocations(req: Request, res: Response) {
    try {
        const { portfolioId } = req.params;

        const allocations = await getPortfolioAllocations(portfolioId);

        return res.status(200).json({
            success: true,
            data: allocations,
        });
    } catch (error) {
        logger.error("Error fetching allocations", error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch portfolio allocations.",
        });
    }
}

export async function updateAllocations(req: Request, res: Response) {
    try {
        const { portfolioId } = req.params;
        const { allocations } = req.body;

        // --- Basic structure validation ---
        if (!allocations || !Array.isArray(allocations)) {
            return res.status(400).json({
                success: false,
                message: "Allocations must be an array of { tokenId, percent }.",
            });
        }

        if (allocations.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Allocations array cannot be empty.",
            });
        }

        // --- Validate tokenIds exist ---
        const tokenIds = allocations.map((a) => a.tokenId);
        const tokens = await prisma.token.findMany({
            where: { id: { in: tokenIds } },
            select: { id: true, symbol: true },
        });

        if (tokens.length !== tokenIds.length) {
            const validIds = tokens.map((t: { id: any; }) => t.id);
            const invalidIds = tokenIds.filter((id) => !validIds.includes(id));
            return res.status(400).json({
                success: false,
                message: "Some provided tokenIds do not exist.",
                invalidIds,
            });
        }

        // --- Validate percentages ---
        const totalPercent = allocations.reduce((sum, a) => sum + a.percent, 0);
        const invalidPercents = allocations.filter(
            (a) => typeof a.percent !== "number" || a.percent <= 0
        );

        if (invalidPercents.length > 0) {
            return res.status(400).json({
                success: false,
                message: "Each allocation percent must be a positive number.",
            });
        }

        // Allow small rounding error (e.g., 99.9 - 100.1)
        if (Math.abs(totalPercent - 100) > 0.1) {
            return res.status(400).json({
                success: false,
                message: `Total allocation percentage must sum to 100%. Currently ${totalPercent.toFixed(
                    2
                )}%.`,
            });
        }

        // --- Save the allocations ---
        await setPortfolioAllocations(portfolioId, allocations);

        return res.status(200).json({
            success: true,
            message: "Portfolio allocations updated successfully.",
        });
    } catch (error) {
        logger.error("Error updating allocations", error);
        return res.status(500).json({
            success: false,
            message: "Failed to update portfolio allocations.",
        });
    }
}

// DELETE /api/allocations/:portfolioId/:tokenId
export async function deleteSingleAllocation(req: Request, res: Response) {
    try {
        const { portfolioId, tokenId } = req.params;

        if (!portfolioId || !tokenId) {
            return res.status(400).json({
                success: false,
                message: "Both portfolioId and tokenId are required.",
            });
        }

        // Check if the allocation exists first
        const existing = await prisma.portfolioAllocation.findFirst({
            where: { portfolioId, tokenId },
        });

        if (!existing) {
            return res.status(404).json({
                success: false,
                message: "Allocation not found for this portfolio and token.",
            });
        }

        await deletePortfolioAllocation(portfolioId, tokenId);

        return res.status(200).json({
            success: true,
            message: "Portfolio allocation deleted successfully.",
        });
    } catch (error) {
        logger.error("Error deleting allocation", error);
        return res.status(500).json({
            success: false,
            message: "Failed to delete portfolio allocation.",
        });
    }
}


// DELETE /api/allocations/:portfolioId
export async function deleteAllAllocations(req: Request, res: Response) {
    try {
        const { portfolioId } = req.params;

        if (!portfolioId) {
            return res.status(400).json({
                success: false,
                message: "portfolioId is required.",
            });
        }

        // Check if there are any allocations first
        const count = await prisma.portfolioAllocation.count({
            where: { portfolioId },
        });

        if (count === 0) {
            return res.status(404).json({
                success: false,
                message: "No allocations found for this portfolio.",
            });
        }

        // Delete all allocations
        await deleteAllPortfolioAllocations(portfolioId);

        return res.status(200).json({
            success: true,
            message: `All (${count}) allocations deleted successfully for portfolio ${portfolioId}.`,
        });
    } catch (error) {
        logger.error("Error deleting all allocations", error);
        return res.status(500).json({
            success: false,
            message: "Failed to delete all portfolio allocations.",
        });
    }
}
