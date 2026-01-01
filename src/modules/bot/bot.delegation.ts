import { monadTestnet ,sepolia} from "viem/chains";
import { http } from "viem";
import { createPaymasterClient } from "viem/account-abstraction";
import { createPimlicoClient } from "permissionless/clients/pimlico";
import { reconstructSmartAccount } from "../../utils/delegationhelpers.js";
import { redeemDelegation } from "../delegation/services.js";
import { getBotByName, getContractAddressByName, getDelegationById } from "../../utils/dbhelpers.js";
import { RebalanceParams } from "./bot.types.js";



export async function redeemDelegationService(delegationID: string, reBalance: RebalanceParams) {

     const smartPorfolioAddress = await getContractAddressByName('SmartPortfolioContract');
     if(!smartPorfolioAddress){
         throw new Error("smartporfolio address not found");
     }
           //TODO: smartPortfolioAddress should be gotten from the deeployed portfolio use the delegation   id to find the portfolio address ofthe delegator

    if (!delegationID) {
        throw new Error("delegation id is required");
    }

    const delegation = await getDelegationById(delegationID);


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
    
    const delegatePrivateKey: `0x${string}` | undefined = bot.privateKey;
    if (!delegatePrivateKey) {
        throw new Error("BOT_PRIVATE_KEY environment variable is missing");
    }

    const delegateSmartAccount = await reconstructSmartAccount(delegatePrivateKey);
    
    const rpcUrl = process.env.PIMLICO_API_URL_SEPOLIA;
    if (!rpcUrl) {
        throw new Error("PIMLICO_API_URL_SEPOLIA environment variable is missing");
    }
    // Redeem the delegation using the bot's smart account and stored signed delegation
    let pimlicoClient;
    pimlicoClient = createPimlicoClient({
        chain: sepolia,
        transport: http(rpcUrl),
    });
    // Paymaster client
    const paymasterClient = createPaymasterClient({
        transport: http(rpcUrl),
    });
    

    return await redeemDelegation(signedDelegation, delegateSmartAccount, smartPorfolioAddress, reBalance, rpcUrl, pimlicoClient, paymasterClient);
}

// DONE : write a db helper that would get the smart contract address for a given bot name instead of hardcoding it.