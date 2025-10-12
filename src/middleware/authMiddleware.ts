import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import prisma from "../config/db.js";

export interface AuthRequest extends Request {
    user?: { id: string; address: string };
}

const authMiddleware = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const authHeader = req.headers["authorization"];
        if (!authHeader) return res.status(401).json({ message: "Authorization header missing" });

        const token = authHeader.split(" ")[1]; // "Bearer TOKEN"
        if (!token) return res.status(401).json({ message: "Token missing" });

        const secret = process.env.JWT_SECRET;
        if (!secret) throw new Error("JWT_SECRET not set");

        const decoded = jwt.verify(token, secret) as { address: string; userId: string; iat: number; exp: number };

        // Verify user exists in DB
        const user = await prisma.user.findUnique({
            where: { id: decoded.userId },
        });
        if (!user) {
            return res.status(401).json({ message: "User not found" });
        }

        req.user = {
            id: user.id,
            address: user.walletAddress,
        };

        next();
    } catch (error) {
        console.error("Auth middleware error:", error);
        return res.status(401).json({ message: "Invalid or expired token" });
    }
};

export default authMiddleware;
