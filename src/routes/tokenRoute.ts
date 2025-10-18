// src/routes/tokenRoute.js
import express from 'express';
import {
    createTokenController,
    getAllTokensController,
    getTokenBySymbolController,
    getTokenByAddressController,
    deleteTokenController
} from '../controllers/tokenController.js';
import authMiddleware, {requireRole} from "../middleware/authMiddleware.js";

const tokenRouter = express.Router();

tokenRouter.post('/',authMiddleware,requireRole(["admin"]), createTokenController);               // POST /api/tokens
tokenRouter.get('/', getAllTokensController);               // GET /api/tokens
tokenRouter.get('/symbol/:symbol', getTokenBySymbolController); // GET /api/tokens/symbol/ETH
tokenRouter.get('/address/:address', getTokenByAddressController); // GET /api/tokens/address/0x...
tokenRouter.delete('/:id',authMiddleware, deleteTokenController);          // DELETE /api/tokens/:id

export default tokenRouter;
