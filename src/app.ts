import express from "express";
import errorHandler from "./middleware/errorHandler.js";
import smartAccountRoute from "./routes/smartAccountRoute.js";
import delegationRoute from "./routes/delegationRoute.js";
import { requestLogger, errorLogger } from "./utils/logger.js";
import authMiddleware, {requireRole} from "./middleware/authMiddleware.js";
import userRouter from "./routes/userRoute.js";
import tokenRouter from "./routes/tokenRoute.js";
import portfolioAllocationRouter from "./routes/portfolioAllocationRoute.js";
import portfolioRouter from "./routes/portfolioRoute.js";
import rebalanceRouter from "./routes/rebalanceLogsRoute.js";
import contractConfigRouter from "./routes/contractConfigRoute.js";
import botRouter from "./routes/botRoute.js";
import loginRouter from "./routes/loginRoute.js";
import oracleRouter from "./routes/oracleRoute.js";
import blockchainRouter from "./routes/blockchainRoute.js";

const app = express();

// Middleware

app.use(express.json());
app.use(requestLogger);
app.use(authMiddleware);

// Routes


// SIWE login route

app.use('/api/login', loginRouter);
app.use('/api/users',authMiddleware,userRouter);
app.use('/api/smartAccounts',authMiddleware,smartAccountRoute);
app.use('/api/delegations',delegationRoute);
app.use('/api/tokens',tokenRouter);
app.use('/api/allocations',authMiddleware,requireRole(["user"]),portfolioAllocationRouter);
app.use("/api/portfolio",authMiddleware,requireRole(["user"]), portfolioRouter);
app.use("/api/rebalance", rebalanceRouter);
app.use("/api/contract",authMiddleware,requireRole(["admin"]),contractConfigRouter);
app.use('/api/bot',authMiddleware,requireRole(["admin"]),botRouter);
app.use('/api/admin/price-polling',authMiddleware,requireRole(['admin']), oracleRouter);
app.use('/api/blockchain',blockchainRouter);


// Error logging middleware (logs errors first)
app.use(errorLogger);

// Error handling middleware (sends response)
app.use(errorHandler);

export default app;
