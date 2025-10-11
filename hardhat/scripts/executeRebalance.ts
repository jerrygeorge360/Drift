import {network} from "hardhat";
import SmartPortfolioArtifact from "../artifacts/contracts/SmartPortfolio.sol/SmartPortfolio.json";
import addresses from '../addresses.json'
import {getAddress, walletActions} from "viem";
const {viem} = await network.connect({
    network: "localhost",
    chainType:"l1",
});

console.log("Sending transaction using the hardhat chain type");


const publicClient = await  viem.getPublicClient();
const address1 = getAddress('0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266')
const walletClient = await viem.getWalletClient(address1)

const chainType = await publicClient.getChainId();
let blockNumber = await publicClient.getBlockNumber();
const block = await publicClient.getBlock();
const gasPrice = await publicClient.getGasPrice()
const estimateFees = await publicClient.estimateFeesPerGas();
const smartAddress = getAddress(addresses.SmartPortfolioModule.Portfolio)
let paused = await publicClient.readContract({address:smartAddress,abi:SmartPortfolioArtifact.abi,functionName:'paused'})
const amount = await publicClient.readContract({address:smartAddress,abi:SmartPortfolioArtifact.abi,functionName:'getEstimatedOut', args: [
        1000n, // amountIn
        ['0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512', '0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9'] // [USDC, WETH]
    ],})
// console.log(chainType);
// console.log(blockNumber);
// console.log(block)
// console.log(gasPrice);
// console.log(estimateFees);
// console.log(amount);
// console.log(paused);
// console.log(estimateFees);
// const pause = await walletClient.writeContract({address:smartAddress,abi:SmartPortfolioArtifact.abi,functionName:'pause'});
// const setAllocation = await walletClient.writeContract({address:smartAddress,abi:SmartPortfolioArtifact.abi,functionName:'setAllocation',args:[[getAddress(addresses.MockContractsModule.USDT),getAddress(addresses.MockContractsModule.WSOL)],[50,50]]});
// const unpause = await walletClient.writeContract({address:smartAddress,abi:SmartPortfolioArtifact.abi,functionName:'unpause'})
// console.log(pause);
// console.log(blockNumber);
// paused = await publicClient.readContract({address:smartAddress,abi:SmartPortfolioArtifact.abi,functionName:'paused'})
// console.log(paused);
// blockNumber = await publicClient.getBlockNumber();
// console.log(blockNumber);
// console.log(setAllocation);
// console.log(await viem.getWalletClients())
// const removeAllocation = await walletClient.writeContract({address:smartAddress,abi:SmartPortfolioArtifact.abi,functionName:'removeAllocation'});
// console.log(removeAllocation);

const params = [
    '0x2546bcd3c84621e976d8185a91a922ae77ecec30', // Your backend/bot
    addresses.MockContractsModule.WSOL,  // DAI
    addresses.MockContractsModule.USDT , // USDC
    1000000000000000000000n,      // 1000 DAI
    995000000000000000000n,    // 995 USDC (0.5% slippage)
    [
        addresses.MockContractsModule.WSOL,  // DAI
       addresses.MockContractsModule.USDT
],
    'Weekly portfolio rebalancing'
];

// Execute the rebalance


const rebalance = await walletClient.writeContract({address:smartAddress,abi:SmartPortfolioArtifact.abi,functionName:'executeRebalance',args: params});
console.log(rebalance);