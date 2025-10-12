import express from "express";
import cors from 'cors'
import { SiweMessage } from 'siwe'
import errorHandler from "./middleware/errorHandler.js";
// import userRoute from "./routes/userRoute.js";
import smartAccountRoute from "./routes/smartAccountRoute.js";
import delegationRoute from "./routes/delegationRoute.js";
import { requestLogger, errorLogger } from "./utils/logger.js";
import authMiddleware from "./middleware/authMiddleware.js";
import {getNonce, siweLogin} from "./controllers/authController.js";
import userRouter from "./routes/userRoute.js";
import tokenRouter from "./routes/tokenRoute.js";

const app = express();

// Middleware

app.use(express.json());
app.use(requestLogger);
app.use(authMiddleware);

// Routes

// Public route to get nonce
app.get("/api/nonce", getNonce);

// SIWE login route
app.post("/api/login", siweLogin);

// Example protected route
app.get("/api/protected", authMiddleware, (req, res) => {
    // @ts-ignore
    res.json({ message: `Hello, wallet ${req.user?.address}!` });
});

app.use('/api/users',authMiddleware,userRouter);
app.use('/api/smartAccounts',authMiddleware,smartAccountRoute);
app.use('/api/delegations',authMiddleware,delegationRoute);
app.use('/api/tokens',tokenRouter);




// Error logging middleware (logs errors first)
app.use(errorLogger);

// Error handling middleware (sends response)
app.use(errorHandler);

export default app;
