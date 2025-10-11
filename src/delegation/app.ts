import { createPublicClient, http } from "viem";
import { hardhat as chain } from "viem/chains";
import { createBundlerClient } from "viem/account-abstraction";
import { Implementation, toMetaMaskSmartAccount } from "@metamask/delegation-toolkit";
import { privateKeyToAccount } from "viem/accounts";
import { parseEther } from "viem";

const publicClient = createPublicClient({
    chain,
    transport: http(),
});

console.log(await publicClient.getBlockNumber());


// const bundlerClient = createBundlerClient({
//     client: publicClient,
//     transport: http("https://your-bundler-rpc.com"),
// });
//
// const account = privateKeyToAccount("0x...");
//
// const smartAccount = await toMetaMaskSmartAccount({
//     client: publicClient,
//     implementation: Implementation.Hybrid,
//     deployParams: [account.address, [], [], []],
//     deploySalt: "0x",
//     signer: { account },
// });




// Appropriate fee per gas must be determined for the specific bundler being used.
// const maxFeePerGas = 1n;
// const maxPriorityFeePerGas = 1n;
//
// const userOperationHash = await bundlerClient.sendUserOperation({
//     account: smartAccount,
//     calls: [
//         {
//             to: "0x1234567890123456789012345678901234567890",
//             value: parseEther("1"),
//         },
//     ],
//     maxFeePerGas,
//     maxPriorityFeePerGas,
// });