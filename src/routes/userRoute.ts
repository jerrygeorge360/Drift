import { Router } from "express";
import { getUsers, createUser } from "../controllers/userController.js";
import authMiddleware from "../middleware/authMiddleware.js";
import {createSmartAccount} from "../controllers/smartAccountController.js";
import {createDelegationController, redeemDelegationController} from "../controllers/delegatorController.js";
const router = Router();

router.get("/",authMiddleware, getUsers);
router.post("/", createUser);
router.post('/create-smart-account',createSmartAccount);
router.post('/create-delegation',createDelegationController);
router.post('/revoke-delegation')
router.post('/redeem-delegation',redeemDelegationController);

export default router;
