# Dashboard System Documentation

## Overview

The Dashboard System provides real-time portfolio monitoring and analytics capabilities for the MetaSmartPort platform. It delivers live updates on portfolio performance, token allocations, drift analysis, and rebalancing activities through both REST APIs and Server-Sent Events (SSE).

## Features

### 📊 Real-time Portfolio Analytics
- **Total Asset Value**: Live calculation of portfolio worth in USD
- **Token Breakdown**: Individual token amounts, values, and percentages
- **Drift Analysis**: Real-time monitoring of allocation drift from targets
- **Performance Tracking**: Portfolio value changes over time

### 🔄 Live Updates via SSE
- **Automatic Updates**: Dashboard refreshes every 30 seconds
- **Instant Rebalance Notifications**: Immediate updates when rebalances occur
- **Connection Management**: Automatic handling of client connections

### 📈 Historical Performance
- **Performance Timeline**: Portfolio value changes based on rebalance history
- **Rebalance History**: Recent portfolio rebalancing activities
- **Drift Tracking**: Historical drift analysis and trends

## Architecture

### Components

1. **DashboardService** (`src/services/dashboardService.ts`)
   - Core business logic for dashboard data calculation
   - Portfolio metrics computation
   - Drift analysis algorithms

2. **DashboardSSEController** (`src/controllers/dashboardSSEController.ts`)
   - Server-Sent Events management
   - Client connection handling
   - Real-time data broadcasting

3. **Dashboard Routes** (`src/routes/dashboardRoute.ts`)
   - REST API endpoints
   - SSE endpoint management
   - Authentication integration

### Data Flow

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Client App    │    │   Dashboard API  │    │   Database      │
│                 │    │                  │    │                 │
│ ┌─────────────┐ │    │ ┌──────────────┐ │    │ ┌─────────────┐ │
│ │ Dashboard   │◄┼────┼►│ REST Endpoints│◄┼────┼►│ Portfolio   │ │
│ │ UI          │ │    │ │              │ │    │ │ Data        │ │
│ └─────────────┘ │    │ └──────────────┘ │    │ └─────────────┘ │
│                 │    │                  │    │                 │
│ ┌─────────────┐ │    │ ┌──────────────┐ │    │ ┌─────────────┐ │
│ │ SSE Client  │◄┼────┼►│ SSE Controller│◄┼────┼►│ Token Prices│ │
│ │             │ │    │ │              │ │    │ │             │ │
│ └─────────────┘ │    │ └──────────────┘ │    │ └─────────────┘ │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌──────────────────┐
                       │ Rebalance Events │
                       │ Trigger Updates  │
                       └──────────────────┘
```

## API Endpoints

### REST Endpoints

#### Get Portfolio Dashboard
```
GET /api/dashboard/portfolio/{portfolioId}/dashboard
Authorization: Bearer <token>
```

**Response Structure:**
```typescript
{
  success: boolean;
  data: {
    totalAssetValue: number;
    portfolioPerformance: Array<{
      timeframe: string;
      value: number;
      timestamp: Date;
    }>;
    tokenBreakdown: Array<{
      symbol: string;
      amount: number;
      usdValue: number;
      percentage: number;
      targetPercentage: number;
      drift: number;
    }>;
    driftAnalysis: {
      totalDrift: number;
      significantDrifts: Array<{
        tokenSymbol: string;
        currentDrift: number;
        threshold: number;
      }>;
    };
    recentRebalances: Array<{
      id: string;
      tokenIn: string;
      tokenOut: string;
      amountIn: number;
      amountOut: number;
      driftPercentage: number;
      createdAt: Date;
    }>;
  }
}
```

#### Get User Portfolios Dashboard
```
GET /api/dashboard/user/{userId}/portfolios/dashboard
Authorization: Bearer <token>
```

### SSE Endpoint

#### Real-time Dashboard Stream
```
GET /api/dashboard/portfolio/{portfolioId}/dashboard/stream
Authorization: Bearer <token>
```

**Event Types:**
- `connected`: Initial connection confirmation
- `dashboard-data`: Initial dashboard data payload
- `dashboard-update`: Periodic updates (every 30 seconds)
- `rebalance-update`: Immediate updates on rebalance events
- `heartbeat`: Connection keepalive
- `error`: Error notifications

## Implementation Examples

### Frontend Integration

#### Basic REST API Usage
```typescript
async function fetchDashboardData(portfolioId: string) {
  const response = await fetch(`/api/dashboard/portfolio/${portfolioId}/dashboard`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  
  const data = await response.json();
  return data.data;
}
```

#### SSE Integration
```typescript
class DashboardSSE {
  private eventSource: EventSource;
  
  constructor(portfolioId: string, token: string) {
    this.eventSource = new EventSource(
      `/api/dashboard/portfolio/${portfolioId}/dashboard/stream`,
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );
    
    this.setupEventListeners();
  }
  
  private setupEventListeners() {
    this.eventSource.addEventListener('connected', (event) => {
      console.log('Dashboard connected:', JSON.parse(event.data));
    });
    
    this.eventSource.addEventListener('dashboard-data', (event) => {
      const data = JSON.parse(event.data);
      this.updateDashboard(data);
    });
    
    this.eventSource.addEventListener('dashboard-update', (event) => {
      const data = JSON.parse(event.data);
      this.updateDashboard(data);
    });
    
    this.eventSource.addEventListener('rebalance-update', (event) => {
      const data = JSON.parse(event.data);
      this.handleRebalanceUpdate(data);
    });
    
    this.eventSource.addEventListener('error', (event) => {
      console.error('Dashboard SSE error:', event);
    });
  }
  
  private updateDashboard(data: any) {
    // Update your UI components with new data
    document.getElementById('total-value').textContent = 
      `$${data.totalAssetValue.toLocaleString()}`;
    
    // Update token breakdown table
    this.updateTokenTable(data.tokenBreakdown);
    
    // Update drift indicators
    this.updateDriftIndicators(data.driftAnalysis);
  }
  
  private handleRebalanceUpdate(data: any) {
    // Show notification for rebalance
    this.showNotification('Portfolio rebalanced', 'success');
    this.updateDashboard(data);
  }
  
  disconnect() {
    this.eventSource.close();
  }
}
```

### React Hook Example
```typescript
import { useState, useEffect } from 'react';

interface DashboardData {
  totalAssetValue: number;
  tokenBreakdown: any[];
  driftAnalysis: any;
  recentRebalances: any[];
}

export function useDashboard(portfolioId: string) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const eventSource = new EventSource(
      `/api/dashboard/portfolio/${portfolioId}/dashboard/stream`
    );
    
    eventSource.addEventListener('dashboard-data', (event) => {
      setData(JSON.parse(event.data));
      setLoading(false);
    });
    
    eventSource.addEventListener('dashboard-update', (event) => {
      setData(JSON.parse(event.data));
    });
    
    eventSource.addEventListener('error', () => {
      setError('Connection failed');
      setLoading(false);
    });
    
    return () => eventSource.close();
  }, [portfolioId]);
  
  return { data, loading, error };
}
```

## Configuration

### Environment Variables
- `DATABASE_URL`: PostgreSQL connection string
- `JWT_SECRET`: JWT token signing secret

### Performance Considerations
- **Update Frequency**: Default 30-second intervals for live updates
- **Connection Limits**: Monitor SSE connections via admin endpoint
- **Database Optimization**: Indexes on portfolio and timestamp fields

## Monitoring

### Connection Statistics
Monitor active dashboard connections:
```
GET /api/dashboard/dashboard/connections
```

### Performance Metrics
- Average response time for dashboard data
- Number of active SSE connections
- Database query performance for portfolio calculations

## Security

### Authentication
- All endpoints require valid JWT tokens
- User-specific portfolio access control
- Admin-only connection monitoring

### Rate Limiting
- Implement rate limiting for REST endpoints
- SSE connections automatically managed per portfolio

## Troubleshooting

### Common Issues

1. **SSE Connection Drops**
   - Check network connectivity
   - Verify JWT token validity
   - Monitor server logs for connection errors

2. **Stale Data**
   - Verify periodic update interval (30 seconds)
   - Check rebalance event triggers
   - Review database query performance

3. **High Memory Usage**
   - Monitor number of active SSE connections
   - Check for connection leaks
   - Review client-side connection management

### Debug Logging
Enable debug logging for dashboard operations:
```typescript
// In your environment
DEBUG=dashboard:*
```

## Future Enhancements

### Planned Features
- **Custom Update Intervals**: User-configurable update frequencies
- **Advanced Analytics**: Historical performance charts and trends
- **Alert System**: Configurable drift and performance alerts
- **Mobile Optimization**: Enhanced mobile dashboard experience

### Performance Improvements
- **Caching Layer**: Redis caching for frequently accessed data
- **Database Optimization**: Materialized views for complex calculations
- **CDN Integration**: Static asset optimization for dashboard UI
