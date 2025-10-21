import { bundlerClient, smartAccount,paymasterClient } from "./config.js";
import {http, parseEther, zeroAddress} from "viem";

import { createPimlicoClient } from "permissionless/clients/pimlico";


const pimlicoClient = createPimlicoClient({
 transport: http("https://api.pimlico.io/v2/11155111/rpc?apikey=pim_8WB5fpjMyDDc2gc4o88k3x"),
    });

    const { fast: fee } = await pimlicoClient.getUserOperationGasPrice();
    console.log(fee);

const userOperationHash = await bundlerClient.sendUserOperation({
    account: smartAccount,
    calls: [
        {
            to: zeroAddress,
            value: 0n,
            data: "0x",
        }
    ],

    ...fee,
    paymaster: paymasterClient
});

 const { receipt } = await bundlerClient.waitForUserOperationReceipt({
       hash: userOperationHash
 });

    console.log(receipt.transactionHash);
