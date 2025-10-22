import {Request,Response,NextFunction} from "express";
import { privateKeyToAccount, generatePrivateKey } from "viem/accounts";
import {
    Implementation,
    toMetaMaskSmartAccount,
} from "@metamask/delegation-toolkit";
import {publicClient} from "./clients.js";
import {encryptPrivateKey} from "../utils/encryption.js";
import {
    createSmartAccountdb,
    deleteSmartAccountById,
    findSmartAccountById,
    getUserSmartAccounts
} from "../utils/dbhelpers.js";
import {deploySmartAccountOnChain} from "../deploy/firstDeploy.js";
import {monadTestnet, sepolia} from "viem/chains";

export interface AuthRequest extends Request {
    user?: { id: string; address: string };
}


export const createSmartAccount = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {

        if (!req.user?.address || !req.user?.id) {
            return res.status(401).json({ message: "Unauthorized: User info missing" });
        }


        const walletAddress = req.user.address;
        const userId = req.user.id;

        const privateKey = generatePrivateKey();
        const account = privateKeyToAccount(privateKey);
        const encrypted = encryptPrivateKey(privateKey);
        console.log('Encrypted:', encrypted);


        const smartAccount = await toMetaMaskSmartAccount({
            client: publicClient,
            implementation: Implementation.Hybrid,
            deployParams: [account.address, [], [], []],
            deploySalt: "0x",
            signer: { account },
        });
        const ownerAddress = account.address;

        const createdSmartAccount = await createSmartAccountdb(userId,smartAccount.address,encrypted,walletAddress,ownerAddress);
        return res.status(200).json({message: "created smartAccount",account:createdSmartAccount});

    } catch (err) {
        next(err);
    }
}



export const deleteSmartAccount = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        if (!req.user?.id) {
            return res.status(401).json({ message: "Unauthorized: User info missing" });
        }

        const userId = req.user.id;
        const smartAccountId = req.params.id;

        if (!smartAccountId) {
            return res.status(400).json({ message: "Smart account ID is required" });
        }

        // Get all smart accounts of user
        const userSmartAccounts = await getUserSmartAccounts(userId);

        // Check if smartAccountId is among user's smart accounts
        const smartAccount = userSmartAccounts.find((sa: { id: string; }) => sa.id === smartAccountId);

        if (!smartAccount) {
            return res.status(404).json({ message: "Smart account not found or not owned by you" });
        }

        // Delete the smart account
        await deleteSmartAccountById(smartAccountId);

        return res.status(200).json({ message: "Smart account deleted successfully" });
    } catch (error) {
        next(error);
    }
};

export const getUserSmartAccountList = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        if (!req.user?.id) {
            return res.status(401).json({ message: "Unauthorized: User info missing" });
        }

        const userId = req.user.id;
        const smartAccounts = await getUserSmartAccounts(userId);

        return res.status(200).json({ smartAccounts });
    } catch (error) {
        next(error);
    }
};


export const getSmartAccountById = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        if (!req.user?.id) {
            return res.status(401).json({ message: "Unauthorized: User info missing" });
        }

        const userId = req.user.id;
        const smartAccountId = req.params.id;

        if (!smartAccountId) {
            return res.status(400).json({ message: "Smart account ID is required" });
        }

        const smartAccount = await findSmartAccountById(smartAccountId);

        if (!smartAccount || smartAccount.userId !== userId) {
            return res.status(404).json({ message: "Smart account not found or not owned by you" });
        }

        return res.status(200).json({ smartAccount });
    } catch (error) {
        next(error);
    }
};

export const deployOnchain = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        if (!req.user?.id) {
            return res.status(401).json({ message: "Unauthorized: User info missing" });
        }

        const userId = req.user.id;
        const smartAccountId = req.params.id;

        if (!smartAccountId) {
            return res.status(400).json({ message: "Smart account ID is required" });
        }

        const smartAccount = await findSmartAccountById(smartAccountId);

        if (!smartAccount || smartAccount.userId !== userId) {
            return res.status(404).json({ message: "Smart account not found or not owned by you" });
        }
        const rpcUrl = process.env.PIMLICO_API_URL

        if (!rpcUrl) {
            return res.status(404).json({ message: "RPC url requiredequired" });
        }
        const receipt = await deploySmartAccountOnChain({
            chain: monadTestnet, // or mainnet, polygon etc.
            rpcUrl:rpcUrl,
            smartAccountId: smartAccountId,
        });

        console.log("Deployment receipt:", receipt);
        const transactionResult = receipt
        let resultMessage: string;

        if (transactionResult !== true) {
            // transactionResult is a TransactionReceipt here
            resultMessage = transactionResult.transactionHash;
        } else {
            resultMessage = "Smart account already deployed";
        }

        return res.status(200).json({ message: resultMessage });
    } catch (error) {
        next(error);
    }
};