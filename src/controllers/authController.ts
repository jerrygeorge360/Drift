import { Request, Response } from "express";
import { SiweMessage, generateNonce } from "siwe";
import jwt from "jsonwebtoken";
import { findOrCreateUser, updateUserLastLogin } from "../utils/dbhelpers.js";
import { logger } from "../utils/logger.js";

export const getNonce = (_req: Request, res: Response) => {
    const nonce = generateNonce();
    res.json({ nonce });
};

export const siweLogin = async (req: Request, res: Response) => {
    try {
        const { message, signature } = req.body;
        if (!message || !signature) {
            return res.status(400).json({ message: "Message and signature required" });
        }

        const siweMessage = new SiweMessage(message);
        const { data } = await siweMessage.verify({ signature });


        const secret = process.env.JWT_SECRET;
        if (!secret) throw new Error("JWT_SECRET not set");


        const user = await findOrCreateUser(data.address);
        await updateUserLastLogin(user.id);

        // Issue JWT with wallet address(expires in 10hrs)
        const token = jwt.sign({ address: user.walletAddress, userId: user.id }, secret, { expiresIn: "10h" });

        res.json({ token });
    } catch (error) {
        logger.error("SIWE login error", error);
        res.status(401).json({ message: "Invalid SIWE signature" });
    }
};
