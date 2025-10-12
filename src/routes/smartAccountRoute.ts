import { Router } from "express";
import {
    createSmartAccount,
    deleteSmartAccount, getSmartAccountById,
    getUserSmartAccountList
} from "../controllers/smartAccountController.js";
import {getUserSmartAccounts} from "../utils/dbhelpers.js";
const smartAccountRouter = Router();


smartAccountRouter.post('/smart-accounts', createSmartAccount);
smartAccountRouter.delete('/smart-accounts/:id', deleteSmartAccount);
smartAccountRouter.get('/smart-accounts', getUserSmartAccountList);
smartAccountRouter.get('/smart-accounts/:id', getSmartAccountById);


export default smartAccountRouter;
