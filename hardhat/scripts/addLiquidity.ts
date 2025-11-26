import hre from "hardhat";

/**
 * Add liquidity to Uniswap V2 pools on Monad testnet
 * This script handles the deadline automatically
 * 
 * Usage:
 * npx hardhat run scripts/addLiquidity.ts --network monadTestnet
 */

async function main() {
    console.log("🏊 Adding liquidity to Uniswap V2 pools...\n");

    const [deployer] = await hre.viem.getWalletClients();
    const publicClient = await hre.viem.getPublicClient();

    const myAddress = deployer.account.address;
    console.log("Your address:", myAddress);

    // Contract addresses
    const routerAddress = "0x4b2ab38dbf28d31d467aa8993f6c2585981d6804";
    const daiAddress = "0xCC0DF0CD04526faB0B3d396456257D059f439548";
    const wethAddress = "0xb1F65f83C94Fe67EbA77299632e891C39c163Cf3";
    const wmonAddress = "0x760AfE86e5de5fa0Ee542fc7B7B713e1c5425701";

    // Get contracts
    const router = await hre.viem.getContractAt("IUniswapV2Router02", routerAddress);
    const dai = await hre.viem.getContractAt("TestDAI", daiAddress);
    const weth = await hre.viem.getContractAt("TestWETH", wethAddress);
    const wmon = await hre.viem.getContractAt("IWETH9", wmonAddress);

    // Check balances
    console.log("\n💰 Your Token Balances:");
    const daiBalance = await dai.read.balanceOf([myAddress]);
    const wethBalance = await weth.read.balanceOf([myAddress]);
    const wmonBalance = await wmon.read.balanceOf([myAddress]);

    console.log("  DAI:", (Number(daiBalance) / 1e18).toFixed(2));
    console.log("  WETH:", (Number(wethBalance) / 1e18).toFixed(4));
    console.log("  WMON:", (Number(wmonBalance) / 1e18).toFixed(4));

    // Amounts for liquidity
    const daiAmount = 75n * 10n ** 18n;  // 75 DAI
    const wethAmount = 375n * 10n ** 17n;  // 0.0375 WETH
    const wmonAmountForDAI = 75n * 10n ** 15n;  // 0.075 WMON
    const wmonAmountForWETH = 75n * 10n ** 15n;  // 0.075 WMON

    console.log("\n" + "=".repeat(60));
    console.log("Pool 1: DAI/WMON");
    console.log("=".repeat(60));

    // Check and approve DAI
    console.log("\n📝 Checking DAI approval...");
    const daiAllowance = await dai.read.allowance([myAddress, routerAddress]);
    if (daiAllowance < daiAmount) {
        console.log("Approving DAI...");
        await dai.write.approve([routerAddress, 2n ** 256n - 1n]);
        console.log("✅ DAI approved");
    } else {
        console.log("✅ DAI already approved");
    }

    // Check and approve WMON for DAI pool
    console.log("\n📝 Checking WMON approval...");
    const wmonAllowance = await publicClient.readContract({
        address: wmonAddress,
        abi: [{
            name: "allowance",
            type: "function",
            stateMutability: "view",
            inputs: [
                { name: "owner", type: "address" },
                { name: "spender", type: "address" }
            ],
            outputs: [{ name: "", type: "uint256" }]
        }],
        functionName: "allowance",
        args: [myAddress, routerAddress]
    });

    if (wmonAllowance < (wmonAmountForDAI + wmonAmountForWETH)) {
        console.log("Approving WMON...");
        await deployer.writeContract({
            address: wmonAddress,
            abi: [{
                name: "approve",
                type: "function",
                stateMutability: "nonpayable",
                inputs: [
                    { name: "guy", type: "address" },
                    { name: "wad", type: "uint256" }
                ],
                outputs: [{ name: "", type: "bool" }]
            }],
            functionName: "approve",
            args: [routerAddress, 2n ** 256n - 1n]
        });
        console.log("✅ WMON approved");
    } else {
        console.log("✅ WMON already approved");
    }

    // Get current block to calculate deadline
    const block = await publicClient.getBlock();
    const deadline = block.timestamp + 1200n; // 20 minutes from current block time

    console.log("\n📝 Adding DAI/WMON liquidity...");
    console.log("  DAI amount:", (Number(daiAmount) / 1e18).toFixed(2));
    console.log("  WMON amount:", (Number(wmonAmountForDAI) / 1e18).toFixed(4));
    console.log("  Deadline:", deadline.toString());

    try {
        const hash = await router.write.addLiquidity([
            daiAddress,
            wmonAddress,
            daiAmount,
            wmonAmountForDAI,
            0n, // amountAMin
            0n, // amountBMin
            myAddress,
            deadline
        ]);

        console.log("Transaction hash:", hash);
        console.log("Waiting for confirmation...");

        const receipt = await publicClient.waitForTransactionReceipt({ hash });

        if (receipt.status === "success") {
            console.log("✅ DAI/WMON pool created successfully!");
        } else {
            console.log("❌ Transaction failed");
        }
    } catch (error: any) {
        console.error("❌ Error adding DAI/WMON liquidity:", error.message);
    }

    console.log("\n" + "=".repeat(60));
    console.log("Pool 2: WETH/WMON");
    console.log("=".repeat(60));

    // Check and approve WETH
    console.log("\n📝 Checking WETH approval...");
    const wethAllowance = await weth.read.allowance([myAddress, routerAddress]);
    if (wethAllowance < wethAmount) {
        console.log("Approving WETH...");
        await weth.write.approve([routerAddress, 2n ** 256n - 1n]);
        console.log("✅ WETH approved");
    } else {
        console.log("✅ WETH already approved");
    }

    // Get fresh deadline
    const block2 = await publicClient.getBlock();
    const deadline2 = block2.timestamp + 1200n;

    console.log("\n📝 Adding WETH/WMON liquidity...");
    console.log("  WETH amount:", (Number(wethAmount) / 1e18).toFixed(4));
    console.log("  WMON amount:", (Number(wmonAmountForWETH) / 1e18).toFixed(4));
    console.log("  Deadline:", deadline2.toString());

    try {
        const hash = await router.write.addLiquidity([
            wethAddress,
            wmonAddress,
            wethAmount,
            wmonAmountForWETH,
            0n,
            0n,
            myAddress,
            deadline2
        ]);

        console.log("Transaction hash:", hash);
        console.log("Waiting for confirmation...");

        const receipt = await publicClient.waitForTransactionReceipt({ hash });

        if (receipt.status === "success") {
            console.log("✅ WETH/WMON pool created successfully!");
        } else {
            console.log("❌ Transaction failed");
        }
    } catch (error: any) {
        console.error("❌ Error adding WETH/WMON liquidity:", error.message);
    }

    console.log("\n" + "=".repeat(60));
    console.log("✅ Liquidity addition complete!");
    console.log("=".repeat(60));
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
