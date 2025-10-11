import {createTestClient,publicActions,walletActions,http} from "viem";
import {hardhat,monadTestnet} from "viem/chains";
import {privateKeyToAccount} from "viem/accounts";
import { generatePrivateKey } from 'viem/accounts'

const privateKey = generatePrivateKey()
const client = createTestClient({
    chain:hardhat,
    mode:'hardhat',
    transport:http(),
})
    .extend(publicActions)
    .extend(walletActions);


const blockNumber = await client.getBlockNumber();
console.log(blockNumber);

