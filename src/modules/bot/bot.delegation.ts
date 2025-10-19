import {reconstructSmartAccount} from "../../utils/delegationhelpers.js";
import {redeemDelegation} from "../delegation/services.js";
import {getBotByName, getDelegationById} from "../../utils/dbhelpers.js";
import {decryptPrivateKey} from "../../utils/encryption.js";

export type RebalanceParams = {
    botAddress: string;
    tokenIn: string;
    tokenOut: string;
    amountIn: bigint;
    amountOutMin: bigint;
    swapPath: string[];
    reason: string;
}


export async function redeemDelegationService(smartAccountID: string, reBalance: {
    botAddress: any;
    tokenIn: any;
    tokenOut: any;
    amountOut: bigint;
    amountInMin: bigint;
    swapPath: any[];
    reason: string
}) {
    if (!smartAccountID) {
        throw new Error("Smart account id is required");
    }

    // Fetch delegations for all smart accounts
    const delegation = await getDelegationById(smartAccountID);

    if (!delegation) {
        throw new Error("No stored delegation found in this smart account,seeing this means there is a bug in the system");
    }

    // Find the first delegation with a valid signed signature
 const delegationRecord = delegation.signature ? delegation : null;


    if (!delegationRecord) {
        throw new Error("No valid signed delegation found");
    }

    const signedDelegation = delegationRecord.signature;
    const bot = await getBotByName('alpha',true);
    if (!bot || !bot.encryptedKey) throw new Error('Bot not found or missing key');
    // get this from the bot database
    const delegatePrivateKey: `0x${string}` = decryptPrivateKey(bot.encryptedKey);
    if (!delegatePrivateKey) {
        throw new Error("BOT_PRIVATE_KEY environment variable is missing");
    }

    const delegateSmartAccount = await reconstructSmartAccount(delegatePrivateKey);

    // Redeem the delegation using the bot's smart account and stored signed delegation
    return await redeemDelegation(signedDelegation, delegateSmartAccount,delegateSmartAccount.address,reBalance);
}
