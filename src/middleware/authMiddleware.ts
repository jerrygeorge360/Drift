import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

// Extend Express Request type to include user info
export interface AuthRequest extends Request {
    user?: any;
}

const authMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        // Get token from Authorization header: "Bearer <token>"
        const authHeader = req.headers["authorization"];
        if (!authHeader) {
            return res.status(401).json({ message: "Authorization header missing" });
        }

        const token = authHeader.split(" ")[1]; // "Bearer TOKEN"
        if (!token) {
            return res.status(401).json({ message: "Token missing" });
        }

        // Verify token
        const secret = process.env.JWT_SECRET || "changeme";
        const decoded = jwt.verify(token, secret);

        // Attach decoded payload to request
        req.user = decoded;

        next(); // Continue to controller
    } catch (error) {
        return res.status(401).json({ message: "Invalid or expired token" });
    }
};

export default authMiddleware;
