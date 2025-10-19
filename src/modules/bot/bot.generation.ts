
import { privateKeyToAccount,generatePrivateKey } from 'viem/accounts'
import {decryptPrivateKey, encryptPrivateKey} from "../../utils/encryption.js";

const privateKey:`0x${string}`= '0x80e93166cb479e5ce36b535e20cd48579124d4880ff7eb50409c15b9641028bd'

if(!privateKey){
    throw('No smartAccount or privateKey failed')
}

const account = privateKeyToAccount(privateKey);

console.log(`Address: ${account.address}`)
// console.log('')