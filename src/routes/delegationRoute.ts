import { Router } from "express";
import {
    createDelegationController,

    revokeDelegationController
} from "../controllers/delegatorController.js";
import {userRedeemWebhook} from "../controllers/webhookController.js";

const delegationRouter = Router();

// Create a new delegation
delegationRouter.post('/delegations', createDelegationController);

// Revoke an existing delegation
delegationRouter.put('/delegations/:delegationId/revoke', revokeDelegationController);

// Webhook to handle user-specific delegation redeems (triggered externally)
delegationRouter.post('/webhooks/delegations/:smartAccountID/redeem', userRedeemWebhook);


export default delegationRouter;
