import { Request, Response } from "express";
import {MetaMaskSmartAccount} from "@metamask/delegation-toolkit"
import {createSignedDelegation as delegationService,redeemDelegation as redeemDelegation} from "../modules/delegation/services.js";

export const createDelegationController = async (req: Request, res: Response) => {
    try {
        const data = req.body;


        const delegatorSmartAccount: MetaMaskSmartAccount = data.delegatorSmartAccount;
        const delegateSmartAccount: MetaMaskSmartAccount = data.delegateSmartAccount;
        const scope = data.scope || {};

        // Create and sign the delegation
        const signedDelegation = await delegationService(
            delegatorSmartAccount,
            delegateSmartAccount,
            scope
        );

        // Send success response
        return res.status(200).json({
            message: "Delegation created successfully",
            signedDelegation,
        });
    } catch (error: any) {
        console.error("Error creating delegation:", error);
        return res.status(500).json({
            message: "Failed to create delegation",
            error: error.message || error,
        });
    }
};


export const redeemDelegationController = async (req: Request, res: Response) => {
    try {
        const data = req.body;

        const signedDelegation = data.signedDelegation;
        const delegateSmartAccount: MetaMaskSmartAccount = data.delegateSmartAccount;

        // Redeem the signed delegation
        const redemptionResult = await redeemDelegation(signedDelegation, delegateSmartAccount);

        // Send success response
        return res.status(200).json({
            message: "Delegation redeemed successfully",
            result: redemptionResult,
        });
    } catch (error: any) {
        console.error("Error redeeming delegation:", error);
        return res.status(500).json({
            message: "Failed to redeem delegation",
            error: error.message || error,
        });
    }
};