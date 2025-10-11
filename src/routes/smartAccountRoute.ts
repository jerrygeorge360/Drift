import { Router } from "express";
import {createSmartAccount} from "../controllers/smartAccountController.js";
const smartAccountRouter = Router();


smartAccountRouter.post('/create-smart-account',createSmartAccount);



export default smartAccountRouter;
