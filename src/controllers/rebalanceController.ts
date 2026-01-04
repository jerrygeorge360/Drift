import {Request, Response} from "express";
import {
    getRebalanceLogs,
    createRebalanceLog
} from "../utils/dbhelpers.js";
import { dashboardSSEController } from "./sseController.js";
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

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

    // Trigger dashboard update for real-time clients
    try {
        await dashboardSSEController.triggerRebalanceUpdate(portfolioId);
    } catch (error) {
        console.error('Failed to trigger dashboard update:', error);
    }

    res.status(201).json({ success: true, data: log });
};

// Get all rebalance logs for a portfolio
export const getRebalanceLogsController = async (req:Request, res:Response) => {
    const { portfolioId } = req.params;

    const logs = await getRebalanceLogs(portfolioId);

    res.json({ success: true, count: logs.length, data: logs });
};

// Get rebalance analytics and performance metrics
export const getRebalanceAnalyticsController = async (req: Request, res: Response) => {
    try {
        const { portfolioId, timeframe = '30d' } = req.query;
        
        // Calculate date range based on timeframe
        const now = new Date();
        const daysAgo = timeframe === '7d' ? 7 : timeframe === '90d' ? 90 : 30;
        const startDate = new Date(now.getTime() - (daysAgo * 24 * 60 * 60 * 1000));

        // Build query conditions
        const whereCondition: any = {
            createdAt: {
                gte: startDate
            }
        };

        if (portfolioId) {
            whereCondition.portfolioId = portfolioId as string;
        }

        // Get rebalance logs with filters
        const rebalanceLogs = await prisma.rebalanceLog.findMany({
            where: whereCondition,
            include: {
                portfolio: {
                    include: {
                        smartAccount: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        // Calculate summary metrics
        const totalRebalances = rebalanceLogs.length;
        const successfulRebalances = rebalanceLogs.filter(log => log.status === 'SUCCESS' || !log.status);
        const successRate = totalRebalances > 0 ? (successfulRebalances.length / totalRebalances) * 100 : 0;
        
        const validDrifts = rebalanceLogs.filter(log => log.driftPercentage !== null);
        const averageDrift = validDrifts.length > 0 
            ? validDrifts.reduce((sum, log) => sum + (log.driftPercentage || 0), 0) / validDrifts.length 
            : 0;

        const validGasCosts = rebalanceLogs.filter(log => log.gasUsed);
        const totalGasCost = validGasCosts.reduce((sum, log) => {
            const gasUsed = parseFloat(log.gasUsed || '0');
            return sum + gasUsed;
        }, 0);
        
        const averageGasCost = validGasCosts.length > 0 ? totalGasCost / validGasCosts.length : 0;

        // Calculate trends by day
        const trendsByDay = new Map<string, { count: number; totalDrift: number; totalGas: number }>();
        
        rebalanceLogs.forEach(log => {
            const dateKey = log.createdAt.toISOString().split('T')[0];
            const current = trendsByDay.get(dateKey) || { count: 0, totalDrift: 0, totalGas: 0 };
            
            current.count += 1;
            current.totalDrift += log.driftPercentage || 0;
            current.totalGas += parseFloat(log.gasUsed || '0');
            
            trendsByDay.set(dateKey, current);
        });

        const trends = Array.from(trendsByDay.entries()).map(([date, data]) => ({
            date,
            rebalanceCount: data.count,
            averageDrift: data.count > 0 ? data.totalDrift / data.count : 0,
            totalGasCost: data.totalGas.toString()
        })).sort((a, b) => a.date.localeCompare(b.date));

        // Calculate portfolio-specific performance
        const portfolioGroups = new Map<string, any[]>();
        rebalanceLogs.forEach(log => {
            const pid = log.portfolioId;
            if (!portfolioGroups.has(pid)) {
                portfolioGroups.set(pid, []);
            }
            portfolioGroups.get(pid)!.push(log);
        });

        const portfolioPerformance = Array.from(portfolioGroups.entries()).map(([pid, logs]) => {
            const successfulLogs = logs.filter(log => log.status === 'SUCCESS' || !log.status);
            const portfolioSuccessRate = logs.length > 0 ? (successfulLogs.length / logs.length) * 100 : 0;
            
            const validPortfolioDrifts = logs.filter(log => log.driftPercentage !== null);
            const portfolioAverageDrift = validPortfolioDrifts.length > 0 
                ? validPortfolioDrifts.reduce((sum, log) => sum + (log.driftPercentage || 0), 0) / validPortfolioDrifts.length 
                : 0;

            const portfolioTotalGas = logs.reduce((sum, log) => sum + parseFloat(log.gasUsed || '0'), 0);

            return {
                portfolioId: pid,
                rebalanceCount: logs.length,
                successRate: portfolioSuccessRate,
                averageDrift: portfolioAverageDrift,
                totalGasCost: portfolioTotalGas.toString()
            };
        });

        const analytics = {
            summary: {
                totalRebalances,
                successRate,
                averageDrift,
                totalGasCost: totalGasCost.toString(),
                averageGasCost: averageGasCost.toString()
            },
            trends,
            portfolioPerformance
        };

        res.json({ success: true, data: analytics });
    } catch (error) {
        console.error('Rebalance analytics error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to fetch rebalance analytics',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};
