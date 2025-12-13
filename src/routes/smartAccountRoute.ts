import { Router } from "express";
import {
    createSmartAccount,
    deleteSmartAccount, getSmartAccountById,
    getUserSmartAccountList
} from "../controllers/smartAccountController.js";
import {getUserSmartAccounts} from "../utils/dbhelpers.js";
const smartAccountRouter = Router();


smartAccountRouter.post('/', createSmartAccount);
smartAccountRouter.delete('/:id', deleteSmartAccount);
smartAccountRouter.get('/', getUserSmartAccountList);
smartAccountRouter.get('/:id', getSmartAccountById);

export default smartAccountRouter;
