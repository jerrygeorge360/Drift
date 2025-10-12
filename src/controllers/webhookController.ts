import { Request, Response } from 'express';
import {redeemDelegationService} from "../modules/bot/bot.delegation.js";

// Webhook to trigger the redeem process when a condition is met for a user
export const userRedeemWebhook = async (req: Request, res: Response) => {
    const { smartAccountID } = req.params;

    try {
        // Call the redeemDelegationService to redeem all valid delegations for the user
        const result = await redeemDelegationService(smartAccountID)

        // Send a success response
        res.status(200).json({ message: 'Redeem process initiated', result });
    } catch (error) {
        console.error('Error in redeem webhook:', error);
        res.status(500).json({ message: 'Failed to redeem delegations'});
    }
};
