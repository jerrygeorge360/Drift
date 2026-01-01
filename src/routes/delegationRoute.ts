import { Router } from "express";
import {
    createDelegationController,
    revokeDelegationController
} from "../controllers/delegatorController.js";
import authMiddleware, {requireRole} from "../middleware/authMiddleware.js";
import { redeemDelegationController } from "../controllers/delegatorController.js";

const delegationRouter = Router();

// Create a new delegation
delegationRouter.post('/:smartAccountId',authMiddleware,requireRole(["user"]), createDelegationController);

// Revoke an existing delegation
delegationRouter.put('/:delegationId/revoke',authMiddleware,requireRole(["user"]), revokeDelegationController);



delegationRouter.post('/:smartAccountId/redeem/:delegationId', authMiddleware,requireRole(["bot"]), redeemDelegationController);




export default delegationRouter;


// readjust this