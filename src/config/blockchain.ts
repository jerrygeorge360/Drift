import {createTestClient,publicActions,walletActions,http} from "viem";
import {hardhat,monadTestnet} from "viem/chains";

const client = createTestClient({
    chain:monadTestnet,
    mode:'hardhat',
    transport:http(),
})
    .extend(publicActions)
    .extend(walletActions);

