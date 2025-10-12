import {Implementation, toMetaMaskSmartAccount} from "@metamask/delegation-toolkit"
import {publicClient} from "../controllers/clients.js";
import {privateKeyToAccount} from "viem/accounts";


// access key from db
export async function reconstructSmartAccount(privateKey:`0x${string}`){
    const account = privateKeyToAccount(privateKey);
    return await toMetaMaskSmartAccount({
        client: publicClient,
        implementation: Implementation.Hybrid,
        deployParams: [account.address, [], [], []],
        deploySalt: "0x",
        signer: {account},
    });
}