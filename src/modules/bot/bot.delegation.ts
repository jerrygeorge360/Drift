import {reconstructSmartAccount} from "../../utils/delegationhelpers.js";
import {redeemDelegation} from "../delegation/services.js";
import {getDelegationById} from "../../utils/dbhelpers.js";

export async function redeemDelegationService(smartAccountID: string) {
    if (!smartAccountID) {
        throw new Error("Smart account id is required");
    }

    // Fetch delegations for all smart accounts
    const delegation = await getDelegationById(smartAccountID);

    if (!delegation) {
        throw new Error("No stored delegation found in this smart account,seeing this means there is a bug in the system");
    }

    // Find the first delegation with a valid signed signature
    const delegationRecord = delegation.find((d: { signedSignature: any; }) => d.signedSignature);

    if (!delegationRecord) {
        throw new Error("No valid signed delegation found");
    }

    const signedDelegation = delegationRecord.signedSignature;

    // get this from the bot database
    const delegatePrivateKey: `0x${string}` = process.env.BOT_PRIVATE_KEY as any;
    if (!delegatePrivateKey) {
        throw new Error("BOT_PRIVATE_KEY environment variable is missing");
    }

    const delegateSmartAccount = await reconstructSmartAccount(delegatePrivateKey);

    // Redeem the delegation using the bot's smart account and stored signed delegation
    return await redeemDelegation(signedDelegation, delegateSmartAccount);
}
