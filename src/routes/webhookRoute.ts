import { Router } from "express";
import {userAgentWebhook} from "../controllers/webhookController.js";
import {verifyWebhookAuth} from "../middleware/webhookMiddleware.js";

const webhookRouter = Router();

// Webhook to handle polling data (triggered by the oracle)
// Sends data to a queuing system.
webhookRouter.post('/webhook',verifyWebhookAuth, userAgentWebhook);




export default webhookRouter