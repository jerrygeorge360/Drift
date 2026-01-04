import express from 'express';
import { dashboardRouter } from './dist/src/routes/dashboardRoute.js';

const app = express();

// Simple test app
app.use('/api/dashboard', dashboardRouter);

app.get('/test', (req, res) => {
  res.json({ message: 'Test route works' });
});

// List all routes
app._router.stack.forEach((middleware) => {
  if (middleware.route) {
    console.log('Route:', middleware.route.path, Object.keys(middleware.route.methods));
  } else if (middleware.name === 'router') {
    const path = middleware.regexp.source.replace(/^\\\//g, '').replace(/\\\/.*$/, '');
    console.log('Router mounted at:', `/${path}`);
    
    middleware.handle.stack.forEach((handler) => {
      if (handler.route) {
        console.log('  Route:', handler.route.path, Object.keys(handler.route.methods));
      }
    });
  }
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Test server running on port ${PORT}`);
  console.log('Try: GET http://localhost:3001/api/dashboard/portfolio/test-id/dashboard/stream');
});
