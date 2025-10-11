import {Request,Response,NextFunction} from "express";
import { privateKeyToAccount, generatePrivateKey } from "viem/accounts";
import {
    Implementation,
    toMetaMaskSmartAccount,
} from "@metamask/delegation-toolkit";
import {publicClient} from "./clients.js";


export const createSmartAccount = async (req: Request, res: Response, next: NextFunction) => {
    try {

        const privateKey = generatePrivateKey();
        const account = privateKeyToAccount(privateKey);



        const smartAccount = await toMetaMaskSmartAccount({
            client: publicClient,
            implementation: Implementation.Hybrid,
            deployParams: [account.address, [], [], []],
            deploySalt: "0x",
            signer: { account },
        });

        res.status(200).send({msg: "created smartAccount"});

    } catch (err) {
        next(err);
    }
}