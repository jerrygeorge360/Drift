import { Router } from "express";
import {
    createDelegationController,
    revokeDelegationController,
    redeemDelegationController,
    checkSmartAccountDelegation
} from "../controllers/delegatorController.js";
import authMiddleware, {requireRole} from "../middleware/authMiddleware.js";

const delegationRouter = Router();

// Create a new delegation
delegationRouter.post('/:smartAccountId',authMiddleware,requireRole(["user"]), createDelegationController);

// Check if smart account has delegation
delegationRouter.get('/:smartAccountId/check', checkSmartAccountDelegation);

// Revoke an existing delegation
delegationRouter.put('/:delegationId/revoke',authMiddleware,requireRole(["user"]), revokeDelegationController);



delegationRouter.post('/:smartAccountId/redeem/:delegationId', authMiddleware,requireRole(["bot"]), redeemDelegationController);




export default delegationRouter;


// readjust this