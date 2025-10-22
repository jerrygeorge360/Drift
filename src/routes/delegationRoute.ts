import { Router } from "express";
import {
    createDelegationController,

    revokeDelegationController
} from "../controllers/delegatorController.js";
import {userAgentWebhook} from "../controllers/webhookController.js";
import {verifyWebhookAuth} from "../middleware/webhookMiddleware.js";
import authMiddleware, {requireRole} from "../middleware/authMiddleware.js";
import {redeemDelegationController} from "../controllers/testcontroller.js";

const delegationRouter = Router();

// Create a new delegation
// delegationRouter.post('/:smartAccountId',authMiddleware,requireRole(["user"]), createDelegationController);

// Revoke an existing delegation
// delegationRouter.put('/:delegationId/revoke',authMiddleware,requireRole(["user"]), revokeDelegationController);

// Webhook to handle user-specific delegation redeems (triggered externally)
delegationRouter.post('/webhook', userAgentWebhook);

delegationRouter.post('/test/redeem', redeemDelegationController);




export default delegationRouter;
