import { monadTestnet } from "viem/chains";
import { http } from "viem";
import { createPaymasterClient } from "viem/account-abstraction";
import { createPimlicoClient } from "permissionless/clients/pimlico";
import { reconstructSmartAccount } from "../../utils/delegationhelpers.js";
import { redeemDelegation } from "../delegation/services.js";
import { getBotByName, getDelegationById } from "../../utils/dbhelpers.js";
import { RebalanceParams } from "./bot.types.js";
import { getDelegationBySmartAccountId } from "../../utils/dbhelpers.js";


export async function redeemDelegationService(smartAccountID: string, reBalance: RebalanceParams) {

    if (!smartAccountID) {
        throw new Error("Smart account id is required");
    }

    // Fetch delegation for this smart account
    // const delegation = await getDelegationBySmartAccountId(smartAccountID);

    const delegation = await getDelegationById('cmj4hx0yy0000im4ifbbfiui2');


    if (!delegation) {
        throw new Error("No stored delegation found in this smart account");
    }


    // Find the first delegation with a valid signed signature
    const delegationRecord = delegation.signature ? delegation : null;


    if (!delegationRecord) {
        throw new Error("No valid signed delegation found");
    }

    const signedDelegation = delegationRecord.signature;
    const bot = await getBotByName('Drift', true);
    if (!bot || !bot.encryptedKey) throw new Error('Bot not found or missing key');
    // get this from the bot database
    const delegatePrivateKey: `0x${string}` | undefined = bot.privateKey;
    if (!delegatePrivateKey) {
        throw new Error("BOT_PRIVATE_KEY environment variable is missing");
    }

    const delegateSmartAccount = await reconstructSmartAccount(delegatePrivateKey);
    const rpcUrl = process.env.PIMLICO_API_URL;
    if (!rpcUrl) {
        throw new Error("PIMLICO_API_URL environment variable is missing");
    }
    // Redeem the delegation using the bot's smart account and stored signed delegation
    let pimlicoClient;
    pimlicoClient = createPimlicoClient({
        chain: monadTestnet,
        transport: http(rpcUrl),
    });
    // Paymaster client
    const paymasterClient = createPaymasterClient({
        transport: http(rpcUrl),
    });


    return await redeemDelegation(signedDelegation, delegateSmartAccount, '0x065A0af7bfF900deB2Bcb7Ae3fc6e1dD52579aC7', reBalance, rpcUrl, pimlicoClient, paymasterClient);
}

// TODO : write a db helper that would get the smart contract address for a given bot name instead of hardcoding it.