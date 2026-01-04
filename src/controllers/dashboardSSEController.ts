import { Request, Response } from 'express';
import { DashboardService } from '../services/dashboardService.js';

export class DashboardSSEController {
  private clients: Map<string, Response[]> = new Map();
  private dashboardService: DashboardService;
  private updateQueue: Set<string> = new Set(); // Prevent duplicate updates
  private maxConnectionsPerPortfolio: number = 10; // Prevent abuse
  private totalConnections: number = 0;
  private maxTotalConnections: number = 100;

  constructor() {
    this.dashboardService = new DashboardService();
    this.startPeriodicUpdates();
  }

  async connectDashboard(req: Request, res: Response) {
    const { portfolioId } = req.params;

    // Connection limits
    if (this.totalConnections >= this.maxTotalConnections) {
      res.status(429).json({ error: 'Too many SSE connections' });
      return;
    }

    const portfolioClients = this.clients.get(portfolioId) || [];
    if (portfolioClients.length >= this.maxConnectionsPerPortfolio) {
      res.status(429).json({ error: 'Too many connections for this portfolio' });
      return;
    }

    // Set SSE headers with additional optimizations
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control',
      'X-Accel-Buffering': 'no', // Nginx optimization
      'Content-Encoding': 'identity' // Prevent compression buffering
    });

    // Add client to the list
    if (!this.clients.has(portfolioId)) {
      this.clients.set(portfolioId, []);
    }
    this.clients.get(portfolioId)!.push(res);
    this.totalConnections++;

    // Send initial data asynchronously
    setImmediate(async () => {
      try {
        const dashboardData = await this.dashboardService.getPortfolioDashboardData(portfolioId);
        this.sendToClient(res, 'dashboard-data', dashboardData);
        this.sendToClient(res, 'connected', { portfolioId, timestamp: new Date() });
      } catch (error) {
        this.sendToClient(res, 'error', { message: 'Failed to fetch initial data' });
      }
    });

    // Send heartbeat every 30 seconds
    const heartbeat = setInterval(() => {
      try {
        this.sendToClient(res, 'heartbeat', { timestamp: new Date() });
      } catch (error) {
        clearInterval(heartbeat);
      }
    }, 30000);

    // Handle client disconnect
    req.on('close', () => {
      clearInterval(heartbeat);
      this.totalConnections--;
      const clients = this.clients.get(portfolioId);
      if (clients) {
        const index = clients.indexOf(res);
        if (index > -1) {
          clients.splice(index, 1);
        }
        if (clients.length === 0) {
          this.clients.delete(portfolioId);
        }
      }
    });
  }

  private sendToClient(res: Response, event: string, data: any) {
    try {
      res.write(`event: ${event}\n`);
      res.write(`data: ${JSON.stringify(data)}\n\n`);
    } catch (error) {
      // Client disconnected
    }
  }

  async broadcastToPortfolio(portfolioId: string, event: string, data: any) {
    const clients = this.clients.get(portfolioId);
    if (!clients || clients.length === 0) {
      return;
    }

    // Use setImmediate to prevent blocking
    setImmediate(() => {
      const deadClients: number[] = [];

      clients.forEach((client, index) => {
        try {
          this.sendToClient(client, event, data);
        } catch (error) {
          deadClients.push(index);
        }
      });

      // Clean up dead connections
      if (deadClients.length > 0) {
        deadClients.reverse().forEach(index => {
          clients.splice(index, 1);
        });

        if (clients.length === 0) {
          this.clients.delete(portfolioId);
        }
      }
    });
  }

  private startPeriodicUpdates() {
    // Use setImmediate to prevent blocking the event loop
    setInterval(() => {
      setImmediate(async () => {
        const portfolioIds = Array.from(this.clients.keys());
        
        // Process portfolios in batches to prevent blocking
        const batchSize = 5;
        for (let i = 0; i < portfolioIds.length; i += batchSize) {
          const batch = portfolioIds.slice(i, i + batchSize);
          
          // Process batch concurrently, not sequentially
          await Promise.allSettled(
            batch.map(portfolioId => this.updatePortfolioDashboard(portfolioId))
          );
          
          // Yield control back to event loop between batches
          if (i + batchSize < portfolioIds.length) {
            await new Promise(resolve => setImmediate(resolve));
          }
        }
      });
    }, 30000);
  }

  private async updatePortfolioDashboard(portfolioId: string) {
    // Prevent duplicate updates
    if (this.updateQueue.has(portfolioId)) {
      return;
    }

    const clients = this.clients.get(portfolioId);
    if (!clients || clients.length === 0) {
      return;
    }

    this.updateQueue.add(portfolioId);

    try {
      // Add timeout to prevent hanging
      const dashboardData = await Promise.race([
        this.dashboardService.getPortfolioDashboardData(portfolioId),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Dashboard update timeout')), 10000)
        )
      ]) as any;

      await this.broadcastToPortfolio(portfolioId, 'dashboard-update', dashboardData);
    } catch (error) {
      console.error(`Failed to update dashboard for portfolio ${portfolioId}:`, error);
      // Send error to clients instead of silent failure
      await this.broadcastToPortfolio(portfolioId, 'error', {
        message: 'Dashboard update failed',
        portfolioId,
        timestamp: new Date()
      });
    } finally {
      this.updateQueue.delete(portfolioId);
    }
  }

  // Method to trigger immediate updates when rebalance occurs
  async triggerRebalanceUpdate(portfolioId: string) {
    // Don't block the rebalance operation
    setImmediate(async () => {
      try {
        const dashboardData = await Promise.race([
          this.dashboardService.getPortfolioDashboardData(portfolioId),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Rebalance update timeout')), 5000)
          )
        ]) as any;

        await this.broadcastToPortfolio(portfolioId, 'rebalance-update', dashboardData);
      } catch (error) {
        console.error(`Failed to send rebalance update for portfolio ${portfolioId}:`, error);
      }
    });
  }

  // Get active connections count
  getActiveConnections(): { [portfolioId: string]: number } {
    const connections: { [portfolioId: string]: number } = {};
    for (const [portfolioId, clients] of this.clients.entries()) {
      connections[portfolioId] = clients.length;
    }
    return connections;
  }

  // Health monitoring
  getHealthStatus() {
    return {
      totalConnections: this.totalConnections,
      activePortfolios: this.clients.size,
      updateQueueSize: this.updateQueue.size,
      memoryUsage: process.memoryUsage(),
      uptime: process.uptime()
    };
  }
}
