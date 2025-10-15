import hre from "hardhat";
import { createPublicClient, createWalletClient, http, encodeDeployData } from "viem";
import { privateKeyToAccount } from "viem/accounts";

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

    const walletClient = createWalletClient({
        account,
        chain: monadTestnet,
        transport: http('https://testnet-rpc.monad.xyz'),
    });

    console.log("Deploying with account:", account.address);

    // Check balance
    const balance = await publicClient.getBalance({ address: account.address });
    console.log("\n💰 Current Balance:");
    console.log("  Wei:", balance.toString());
    console.log("  MON:", (Number(balance) / 1e18).toFixed(6));

    // Get the compiled contract
    const artifact = await hre.artifacts.readArtifact("SmartPortfolio");

    const routerAddress = "0xfb8e1c3b833f9e67a71c859a132cf783b645e436" as `0x${string}`;

    console.log("\n📋 Deployment Parameters:");
    console.log("  Router:", routerAddress);
    console.log("  Owner:", account.address);

    // Estimate gas cost
    console.log("\n⛽ Estimating deployment cost...");

    try {
        // Get current gas price
        const gasPrice = await publicClient.getGasPrice();
        console.log("  Current Gas Price:", gasPrice.toString(), "wei");
        console.log("  Gas Price in Gwei:", (Number(gasPrice) / 1e9).toFixed(2));

        // Encode the deployment data
        const deployData = encodeDeployData({
            abi: artifact.abi,
            bytecode: artifact.bytecode as `0x${string}`,
            args: [routerAddress, account.address],
        });

        // Estimate gas for deployment
        const estimatedGas = await publicClient.estimateGas({
            account: account.address,
            data: deployData,
        });

        console.log("  Estimated Gas:", estimatedGas.toString());

        // Calculate total cost
        const estimatedCost = gasPrice * estimatedGas;
        const estimatedCostInMON = Number(estimatedCost) / 1e18;

        console.log("\n💵 Estimated Deployment Cost:");
        console.log("  Wei:", estimatedCost.toString());
        console.log("  MON:", estimatedCostInMON.toFixed(6));

        // Add 20% buffer for safety
        const costWithBuffer = estimatedCostInMON * 1.2;
        console.log("  With 20% buffer:", costWithBuffer.toFixed(6), "MON");

        // Check if account has enough balance
        const hasEnough = balance >= estimatedCost;
        console.log("\n✅ Balance Check:");
        console.log("  Required:", estimatedCostInMON.toFixed(6), "MON");
        console.log("  Available:", (Number(balance) / 1e18).toFixed(6), "MON");
        console.log("  Status:", hasEnough ? "✅ Sufficient" : "❌ Insufficient");

        if (!hasEnough) {
            const needed = costWithBuffer - (Number(balance) / 1e18);
            console.log("\n⚠️  You need approximately", needed.toFixed(6), "more MON");
            console.log("Get testnet MON from Monad faucet (check Monad docs for current faucet URL)");
            return;
        }

        // Proceed with deployment
        console.log("\n🚀 Proceeding with deployment...");

        const hash = await walletClient.deployContract({
            abi: artifact.abi,
            bytecode: artifact.bytecode as `0x${string}`,
            args: [routerAddress, account.address],
            gas: estimatedGas + 100000n, // Add buffer to gas limit
        });

        console.log("✅ Transaction hash:", hash);
        console.log("Waiting for confirmation...");

        const receipt = await publicClient.waitForTransactionReceipt({ hash });

        // Calculate actual cost
        const actualCost = receipt.gasUsed * receipt.effectiveGasPrice;
        const actualCostInMON = Number(actualCost) / 1e18;

        console.log("\n🎉 Deployment Successful!");
        console.log("  Contract Address:", receipt.contractAddress);
        console.log("  Block Number:", receipt.blockNumber);
        console.log("  Gas Used:", receipt.gasUsed.toString());
        console.log("  Actual Cost:", actualCostInMON.toFixed(6), "MON");
        console.log("  Transaction Hash:", receipt.transactionHash);

        // Show remaining balance
        const newBalance = await publicClient.getBalance({ address: account.address });
        console.log("\n💰 Remaining Balance:", (Number(newBalance) / 1e18).toFixed(6), "MON");

        return receipt.contractAddress;

    } catch (error: any) {
        console.error("\n❌ Failed:");
        console.error("Error:", error.message);

        if (error.cause) {
            console.error("Cause:", error.cause);
        }

        if (error.details) {
            console.error("Details:", error.details);
        }

        throw error;
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });