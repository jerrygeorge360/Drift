import express from "express";
import errorHandler from "./middleware/errorHandler";
import userRoute from "./routes/userRoute";
import { requestLogger, errorLogger } from "./utils/logger";

const app = express();

// Middleware
app.use(express.json());
app.use(requestLogger);

// Routes
app.use('/api/users', userRoute);

// Error logging middleware (logs errors first)
app.use(errorLogger);

// Error handling middleware (sends response)
app.use(errorHandler);

export default app;
