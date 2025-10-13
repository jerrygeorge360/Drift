import { Request, Response, NextFunction } from "express";
import { verifyHmacSignature } from "../utils/webhook.security.js";

const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || "default_secret";

export const verifyWebhookAuth = (req: Request, res: Response, next: NextFunction) => {
    try {
        const signature = req.headers["x-webhook-signature"] as string;
        if (!signature) {
            return res.status(401).json({ message: "Missing signature header" });
        }

        const payload = JSON.stringify(req.body);
        const isValid = verifyHmacSignature(WEBHOOK_SECRET, payload, signature);

        if (!isValid) {
            return res.status(403).json({ message: "Invalid webhook signature" });
        }

        next();
    } catch (error) {
        console.error("Webhook auth verification failed:", error);
        res.status(500).json({ message: "Internal auth error" });
    }
};
