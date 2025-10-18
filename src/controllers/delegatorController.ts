import {Request, Response} from "express";
import {MetaMaskSmartAccount} from "@metamask/delegation-toolkit"
import {
    createSignedDelegation as delegationService
} from "../modules/delegation/services.js";

import {reconstructSmartAccount} from "../utils/delegationhelpers.js";
import {
    createDelegationdb,
    findSmartAccountById, getBotByName,
    getUserSmartAccounts,
    revokeDelegation
} from "../utils/dbhelpers.js";
import {decryptPrivateKey} from "../utils/encryption.js";

export interface AuthRequest extends Request {
    user?: { id: string; address: string };
}

export const createDelegationController = async (req: AuthRequest, res: Response) => {
    try {
        const data = req.body;


        if (!req.user?.address || !req.user?.id) {
            return res.status(401).json({ message: "Unauthorized: User info missing" });
        }
        const userId = req.user?.id;
        const smartAccountId = req.params.smartAccountId;
        // Get all smart accounts of user
        const userSmartAccounts = await getUserSmartAccounts(userId);

        // Check if smartAccountId is among user's smart accounts
        const smartAccounts = userSmartAccounts.find((sa: { id: string; }) => sa.id === smartAccountId);

        if (!smartAccounts) {
            return res.status(404).json({ message: "Smart account not found or not owned by you" });
        }

        const smartAccount = await findSmartAccountById(smartAccountId)
        if(!smartAccount || !smartAccount.privateKey ) {
            throw('No smartAccount or privateKey failed')
        }
        // collect user ids and query for the keys
        // deencrypt the keys

        const bot = await getBotByName('Drift',true)
        if(!bot || !bot.privateKey){
            return res.status(401).json({ message: "No smartAccount or privateKey failed" });
        }
        const delegatorPrivateKey:`0x${string}` = decryptPrivateKey(smartAccount.privateKey);
        const delegatePrivateKey:`0x${string}`= bot.privateKey;

        const delegatorSmartAccount: MetaMaskSmartAccount = await reconstructSmartAccount(delegatorPrivateKey)
        const delegateSmartAccount: MetaMaskSmartAccount = await reconstructSmartAccount(delegatePrivateKey)



        // Create and sign the delegation
        const signature = await delegationService(
            delegatorSmartAccount,
            delegateSmartAccount,
        );
        if (!smartAccountId || !delegatorPrivateKey || !delegatePrivateKey || !signature) {
            return res.status(400).json({ message: "Missing or invalid fields" });
        }

        const delegation = await createDelegationdb({
            smartAccountId,
            delegatorSmartAccount,
            delegateSmartAccount,
            signature,
        })

        return res.status(200).json({
            message: "Delegation created successfully",
            delegation: {
                id: delegation.id,
                smartAccountId: delegation.smartAccountId,
                delegatorAddress: delegation.delegatorAddress,
                delegateAddress: delegation.delegateAddress,
                createdAt: delegation.createdAt,
                updatedAt: delegation.updatedAt,
            },
        });
    } catch (error: any) {
        console.error("Error creating delegation:", error);
        return res.status(500).json({
            message: "Failed to create delegation",
            error: error.message || error,
        });
    }
};


export const revokeDelegationController = async (req: AuthRequest, res: Response) => {
    try {

        if (!req.user?.address || !req.user?.id) {
            return res.status(401).json({ message: "Unauthorized: User info missing" });
        }
        const userId = req.user?.id;
        const smartAccountId = req.params.smartAccountId;
        // Get all smart accounts of user
        const userSmartAccounts = await getUserSmartAccounts(userId);

        // Check if smartAccountId is among user's smart accounts
        const smartAccounts = userSmartAccounts.find((sa: { id: string; }) => sa.id === smartAccountId);

        if (!smartAccounts) {
            return res.status(404).json({ message: "Smart account not found or not owned by you" });
        }

        await revokeDelegation(smartAccountId);

        return res.status(200).json({
            message: "Delegation revoked successfully",
        });

    }catch (error) {
        console.error("Error revoking delegation:", error);
        // @ts-ignore
        return res.status(500).json({
            message: "Failed to revoke delegation"
        });
    }

}