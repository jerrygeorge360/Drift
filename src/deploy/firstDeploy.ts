// // src/deploySmartAccount.ts
// import { createAASetup } from "./deployScript.js";
// import type { Chain } from "viem";
// import type { TransactionReceipt } from "viem";
// import { createPublicClient, http } from "viem";
// import {monadTestnet} from "viem/chains";

// /**
//  * Deploy a smart account on-chain if it hasn't been deployed yet.
//  * Returns the UserOperation receipt once deployed.
//  */
// export async function deploySmartAccountOnChain({
//                                                     chain,
//                                                     rpcUrl,
//                                                     smartAccountId,

//                                                 }: {
//     chain: Chain;
//     rpcUrl: string;
//     smartAccountId: string;
// }): Promise<TransactionReceipt | true> {
//     // 1️⃣ Initialize AA setup
//     const {
//         publicClient,
//         smartAccount,
//         bundlerClient,
//         paymasterClient,
//         pimlicoClient,
//         zeroAddress,
//     } = await createAASetup({ chain, rpcUrl, smartAccountId });

//     // 2️⃣ Check if the smart account is already deployed
//     // Check if there's code at the address (deployed contracts have code)
//     const address = smartAccount.address;
//     const bytecode = await publicClient.getCode({ address });

//     if (bytecode && bytecode !== '0x') {
//         console.log("✅ Smart account already deployed:", address);
//         return true; // Already deployed, skip deployment
//     }


//     // 3️⃣ Fetch gas fees with fallback
//     let gasParams: { maxFeePerGas: bigint; maxPriorityFeePerGas: bigint };




//     try {
//         // @ts-ignore
//         const pimlicoFee = await pimlicoClient.getUserOperationGasPrice();
//         console.log('✅ Pimlico fee:', pimlicoFee);
//         gasParams = pimlicoFee.fast;
//     } catch (error) {
//         console.warn('⚠️ Pimlico gas price failed, using chain fallback:', error);

//         // Fallback: Get gas prices directly from the chain
//         const publicClient = createPublicClient({
//             chain: chain,
//             transport: http()
//         });



//         const gasPrice = await publicClient.estimateFeesPerGas();
//         console.log('✅ Chain gas price:', gasPrice);

//         // Add 20% buffer to be safe
//         const buffer = 150n; // 120%
//         gasParams = {
//             maxFeePerGas: (gasPrice.maxFeePerGas * buffer) / 100n,
//             maxPriorityFeePerGas: (gasPrice.maxPriorityFeePerGas * buffer) / 100n,
//         };

//         console.log('💰 Adjusted gas params:', {
//             maxFeePerGas: gasParams.maxFeePerGas.toString(),
//             maxPriorityFeePerGas: gasParams.maxPriorityFeePerGas.toString(),
//         });
//     }

//     console.log('🚀 Sending user operation with gas params:', gasParams);

//     // 4️⃣ Create a minimal no-op UserOperation to trigger deployment
//     const userOperationHash = await bundlerClient.sendUserOperation({
//         account: smartAccount,
//         calls: [
//             {
//                 to: zeroAddress,
//                 value: 0n,
//                 data: "0x",
//             },
//         ],
//         maxFeePerGas: gasParams.maxFeePerGas,
//         maxPriorityFeePerGas: gasParams.maxPriorityFeePerGas,
//         paymaster: paymasterClient,
//     });

//     // 5️⃣ Wait for transaction receipt
//     const { receipt } = await bundlerClient.waitForUserOperationReceipt({
//         hash: userOperationHash,
//     });

//     console.log("✅ Smart account deployed:", address);
//     console.log("📝 Transaction hash:", receipt.transactionHash);

//     return receipt;
// }