import {reconstructSmartAccount} from "../../utils/delegationhelpers.js";
import {redeemDelegation} from "../delegation/services.js";
import {getBotByName, getDelegationById} from "../../utils/dbhelpers.js";
import {decryptPrivateKey} from "../../utils/encryption.js";
import {createPimlicoClient} from "permissionless/clients/pimlico";
import {monadTestnet} from "viem/chains";
import {http} from "viem";
import {createPaymasterClient} from "viem/account-abstraction";

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
    const bot = await getBotByName('Drift',true);
    if (!bot || !bot.encryptedKey) throw new Error('Bot not found or missing key');
    // get this from the bot database
    const delegatePrivateKey: `0x${string}` | undefined = bot.privateKey;
    if (!delegatePrivateKey) {
        throw new Error("BOT_PRIVATE_KEY environment variable is missing");
    }

    const delegateSmartAccount = await reconstructSmartAccount(delegatePrivateKey);
    const rpcUrl='https://api.pimlico.io/v2/10143/rpc?apikey=pim_WUqNB2JADYLUFKAY6TABdF'
    // Redeem the delegation using the bot's smart account and stored signed delegation
    let pimlicoClient;
    pimlicoClient = createPimlicoClient({
        chain:monadTestnet,
        transport: http(rpcUrl),
    });
    // Paymaster client
    const paymasterClient = createPaymasterClient({
        transport: http(rpcUrl),
    });


    return await redeemDelegation(signedDelegation, delegateSmartAccount,delegateSmartAccount.address,reBalance,rpcUrl,pimlicoClient,paymasterClient);
}
