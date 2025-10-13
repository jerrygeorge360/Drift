import express from "express";

import {getNonce, siweLogin} from "../controllers/authController.js";

const loginRouter = express.Router();

// siwe login
loginRouter.post("/", siweLogin);

// public nonce provider
loginRouter.get('/nonce', getNonce);

export default loginRouter
