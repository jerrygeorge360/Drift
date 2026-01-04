import { Router } from 'express';
import { DashboardService } from '../services/dashboardService.js';
import { DashboardSSEController } from '../controllers/dashboardSSEController.js';

const router = Router();
const dashboardService = new DashboardService();
const dashboardSSEController = new DashboardSSEController();

// Get dashboard data (REST endpoint)
router.get('/portfolio/:portfolioId/dashboard', async (req, res) => {
  try {
    const { portfolioId } = req.params;
    const data = await dashboardService.getPortfolioDashboardData(portfolioId);
    res.json({ success: true, data });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch dashboard data',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// SSE endpoint for real-time updates
router.get('/portfolio/:portfolioId/dashboard/stream', (req, res) => {
  dashboardSSEController.connectDashboard(req, res);
});

// Get user's portfolios with basic metrics
router.get('/user/:userId/portfolios/dashboard', async (req, res) => {
  try {
    const { userId } = req.params;
    const portfolios = await dashboardService.getUserPortfolios(userId);
    
    const portfoliosWithMetrics = await Promise.all(
      portfolios.map(async (portfolio) => {
        const dashboardData = await dashboardService.getPortfolioDashboardData(portfolio.id);
        return {
          ...portfolio,
          metrics: {
            totalValue: dashboardData.totalAssetValue,
            totalDrift: dashboardData.driftAnalysis.totalDrift,
            lastRebalance: dashboardData.recentRebalances[0]?.createdAt || null
          }
        };
      })
    );

    res.json({ success: true, data: portfoliosWithMetrics });
  } catch (error) {
    console.error('User portfolios dashboard error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch user portfolios dashboard data' 
    });
  }
});

// Get SSE connection stats
router.get('/dashboard/connections', (req, res) => {
  const connections = dashboardSSEController.getActiveConnections();
  res.json({ success: true, data: connections });
});

// Health monitoring endpoint
router.get('/dashboard/health', (req, res) => {
  const health = dashboardSSEController.getHealthStatus();
  res.json({ success: true, data: health });
});

export { router as dashboardRouter, dashboardSSEController };
