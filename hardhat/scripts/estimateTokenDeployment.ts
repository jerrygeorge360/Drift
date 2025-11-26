import { createPublicClient, http, encodeDeployData } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import hre from "hardhat";
import * as dotenv from "dotenv";

dotenv.config();

async function main() {
    const privateKey = process.env.MONAD_TESTNET_PRIVATE_KEY as `0x${string}`;

    if (!privateKey) {
        throw new Error("MONAD_TESTNET_PRIVATE_KEY not found in .env");
    }

    const account = privateKeyToAccount(privateKey);

    const monadTestnet = {
        id: 10143,
        name: 'Monad Testnet',
        network: 'monad-testnet',
        nativeCurrency: { name: 'MON', symbol: 'MON', decimals: 18 },
        rpcUrls: {
            default: { http: ['https://testnet-rpc.monad.xyz'] },
            public: { http: ['https://testnet-rpc.monad.xyz'] },
        },
    } as const;

    const publicClient = createPublicClient({
        chain: monadTestnet,
        transport: http('https://testnet-rpc.monad.xyz'),
    });

    console.log("⛽ Estimating gas costs for deploying all test tokens...\n");
    console.log("Deployer:", account.address);
    console.log("=".repeat(70));

    // Check current balance
    const balance = await publicClient.getBalance({ address: account.address });
    const balanceInMON = Number(balance) / 1e18;
    console.log("\n💰 Current Balance:", balanceInMON.toFixed(6), "MON\n");

    // Get current gas price
    const gasPrice = await publicClient.getGasPrice();
    const gasPriceInGwei = Number(gasPrice) / 1e9;
    console.log("⛽ Current Gas Price:", gasPriceInGwei.toFixed(2), "Gwei\n");

    const tokens = ["TestUSDC", "TestUSDT", "TestWETH", "TestDAI", "TestWBTC"];
    let totalEstimatedGas = 0n;
    let totalEstimatedCost = 0;

    console.log("📊 Individual Token Estimates:\n");

    for (const tokenName of tokens) {
        try {
            const artifact = await hre.artifacts.readArtifact(tokenName);

            const deployData = encodeDeployData({
                abi: artifact.abi,
                bytecode: artifact.bytecode as `0x${string}`,
                args: [account.address],
            });

            const estimatedGas = await publicClient.estimateGas({
                account: account.address,
                data: deployData,
            });

            const estimatedCost = gasPrice * estimatedGas;
            const estimatedCostInMON = Number(estimatedCost) / 1e18;

            totalEstimatedGas += estimatedGas;
            totalEstimatedCost += estimatedCostInMON;

            console.log(`  ${tokenName}:`);
            console.log(`    Gas: ${estimatedGas.toLocaleString()}`);
            console.log(`    Cost: ${estimatedCostInMON.toFixed(6)} MON`);
            console.log();

        } catch (error: any) {
            console.log(`  ${tokenName}: ❌ Failed to estimate`);
            console.log(`    Error: ${error.shortMessage || error.message}`);
            console.log();
        }
    }

    console.log("=".repeat(70));
    console.log("\n📈 TOTAL ESTIMATES:\n");
    console.log(`  Total Gas: ${totalEstimatedGas.toLocaleString()}`);
    console.log(`  Total Cost: ${totalEstimatedCost.toFixed(6)} MON`);

    // Add 20% safety buffer
    const costWithBuffer = totalEstimatedCost * 1.2;
    console.log(`  With 20% buffer: ${costWithBuffer.toFixed(6)} MON`);

    console.log("\n" + "=".repeat(70));
    console.log("\n💵 COST ANALYSIS:\n");
    console.log(`  You have: ${balanceInMON.toFixed(6)} MON`);
    console.log(`  You need: ${costWithBuffer.toFixed(6)} MON (with buffer)`);

    const difference = balanceInMON - costWithBuffer;

    if (difference >= 0) {
        console.log(`  Status: ✅ SUFFICIENT (${difference.toFixed(6)} MON extra)`);
    } else {
        console.log(`  Status: ❌ INSUFFICIENT (need ${Math.abs(difference).toFixed(6)} more MON)`);
        console.log(`\n  💡 Get more MON from Monad testnet faucet!`);
    }

    console.log("\n" + "=".repeat(70));
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("\n❌ Error:", error.message);
        process.exit(1);
    });
