import { Request, Response } from 'express';
import { findTokenByAddress, findTokenBySymbol, createToken, deleteToken, getAllTokens } from "../utils/dbhelpers.js";
import { logger } from "../utils/logger.js";

// create mew tokens
export const createTokenController = async (req: Request, res: Response) => {
    try {
        const { symbol, name, address, decimals } = req.body;
        if (!symbol || !name || !address || !decimals) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const token = await createToken({ symbol, name, address, decimals });
        res.status(201).json(token);
    } catch (err) {
        logger.error("Error creating token", err);
        res.status(500).json({ error: 'Error creating token' });
    }
};

// get all tokens
export const getAllTokensController = async (req: Request, res: Response) => {
    try {
        const tokens = await getAllTokens();
        res.status(200).json(tokens);
    } catch (err) {
        logger.error("Error fetching tokens", err);
        res.status(500).json({ error: 'Error fetching tokens' });
    }
};

// Get by symbol
export const getTokenBySymbolController = async (req: Request, res: Response) => {
    try {
        const { symbol } = req.params;
        const token = await findTokenBySymbol(symbol.toUpperCase());
        if (!token) return res.status(404).json({ error: 'Token not found' });
        res.status(200).json(token);
    } catch (err) {
        logger.error("Error fetching token by symbol", err);
        res.status(500).json({ error: 'Error fetching token' });
    }
};

// Get by address
export const getTokenByAddressController = async (req: Request, res: Response) => {
    try {
        const { address } = req.params;
        const token = await findTokenByAddress(address);
        if (!token) return res.status(404).json({ error: 'Token not found' });
        res.status(200).json(token);
    } catch (err) {
        logger.error("Error fetching token by address", err);
        res.status(500).json({ error: 'Error fetching token' });
    }
};

//  Delete token
export const deleteTokenController = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        await deleteToken(id);
        res.status(204).send();
    } catch (err) {
        logger.error("Error deleting token", err);
        res.status(500).json({ error: 'Error deleting token' });
    }
};
