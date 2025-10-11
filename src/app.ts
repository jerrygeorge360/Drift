import express from "express";
import errorHandler from "./middleware/errorHandler.js";
import userRoute from "./routes/userRoute.js";
import smartAccountRoute from "./routes/smartAccountRoute.js";
import delegationRoute from "./routes/delegationRoute.js";
import { requestLogger, errorLogger } from "./utils/logger.js";

const app = express();

// Middleware
app.use(express.json());
app.use(requestLogger);

// Routes
app.use('/api/users', userRoute);
app.use('/api/smartAccounts', smartAccountRoute);
app.use('/api/delegations', delegationRoute);

// Error logging middleware (logs errors first)
app.use(errorLogger);

// Error handling middleware (sends response)
app.use(errorHandler);

export default app;
