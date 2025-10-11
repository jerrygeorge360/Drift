import { Router } from "express";
import {createDelegationController, redeemDelegationController} from "../controllers/delegatorController.js";
const delegationRouter = Router();


delegationRouter.post('/create-delegation',createDelegationController);
delegationRouter.post('/revoke-delegation')
delegationRouter.post('/redeem-delegation',redeemDelegationController);

export default delegationRouter;
