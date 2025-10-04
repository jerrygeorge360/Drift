// SPDX-License-Identifier: MIT
import { keccak256 ,toBytes} from "viem";
import assert from "node:assert/strict";
import { describe, it, beforeEach } from "node:test";
import { network } from "hardhat";

describe("SmartPortfolio", async function () {
    // 🔌 Connect to the Hardhat network + viem interface
    const { viem} = await network.connect();
    const publicClient = await viem.getPublicClient();

    let deployer: any;
    let user: any;
    let router: any;
    let tokenA: any;
    let tokenB: any;
    let portfolio: any;

    beforeEach(async function () {
        // ⚙️ Get available wallet clients
        const accounts = await viem.getWalletClients();
        [deployer, user] = accounts;


        // 🧪 Deploy mock ERC20 tokens
        tokenA = await viem.deployContract("MockToken", ["TokenA", "TKA"]);
        tokenB = await viem.deployContract("MockToken", ["TokenB", "TKB"]);

        // 🧪 Deploy mock router
        router = await viem.deployContract("MockRouter");

        // 🧠 Deploy SmartPortfolio
        portfolio = await viem.deployContract("SmartPortfolio", [router.address, deployer.account.address]);

        // 💸 Mint some tokens to user and router
        await tokenA.write.mint([user.account.address, 1_000n * 10n ** 18n]);
        await tokenB.write.mint([router.address, 1_000n * 10n ** 18n]);
        await tokenB.write.mint([user.account.address, 1_000n * 10n ** 18n]); // For potential tokenOut transfers

        // 🪙 Approve portfolio to spend user's tokens
        await tokenA.write.approve([portfolio.address, 1_000n * 10n ** 18n], { account: user.account });
        await tokenB.write.approve([portfolio.address, 1_000n * 10n ** 18n], { account: user.account });

        // Configure MockRouter
        await router.write.setFail([false]);
        await router.write.setFixedOut([1000n]);
    });

    // 1️⃣ Allocation event
    await it("should emit DynamicAllocationSet when calling setAllocation()", async function () {
        const tokens = [tokenA.address, tokenB.address];
        const percents = [60n, 40n];
        const eventSignatureString = "DynamicAllocationSet(address,address[],uint16[])";
        const eventSignatureBytes = toBytes(eventSignatureString);
        // Compute keccak256 hash
        const eventSignature = keccak256(eventSignatureBytes);


        try {
            const tx = await portfolio.write.setAllocation([tokens, percents], {account: user.account});

            const receipt = await publicClient.waitForTransactionReceipt({hash: tx});

            assert.equal(
                receipt.logs.some(log => log.topics[0] ===eventSignature),
                true,
                "DynamicAllocationSet event not emitted"
            );
        } catch (error) {
            // @ts-ignore
            assert.fail(`setAllocation failed: ${error.message}`);
        }
    });

    // 2️⃣ Allocation sum check
    it("should revert if total allocation sum is not 100", async function () {
        const tokens = [tokenA.address, tokenB.address];
        const percents = [70, 20];

        await assert.rejects(
            portfolio.write.setAllocation([tokens, percents], { account: user.account }),
            /sum must = 100/,
            "Expected revert with 'sum must = 100'"
        );
    });

    // 3️⃣ Pause/unpause
    it("should pause and unpause correctly", async function () {
        await portfolio.write.pause({ account: deployer.account });
        assert.equal(await portfolio.read.paused(), true, "Contract should be paused");

        await portfolio.write.unpause({ account: deployer.account });
        assert.equal(await portfolio.read.paused(), false, "Contract should be unpaused");
    });

    // 4️⃣ Rebalance validation
    it("should validate a rebalance path successfully", async function () {
        const path = [tokenA.address, tokenB.address];

        const [valid, reason] = await portfolio.read.validateRebalance([
            tokenA.address,
            tokenB.address,
            1000n,
            500n,
            path,
        ]);

        assert.equal(valid, true, `Validation failed: ${reason}`);
    });

    // 5️⃣ Remove allocation
    it("should remove allocation successfully", async function () {
        const tokens = [tokenA.address];
        const percents = [100];

        await portfolio.write.setAllocation([tokens, percents], { account: user.account });
        await portfolio.write.removeAllocation({ account: user.account });

        const allocs = await portfolio.read.getAllocation([user.account.address]);
        assert.equal(allocs.length, 0, "Allocations should be empty");
    });

    // 6️⃣ Execute rebalance end-to-end
    it("should execute a rebalance successfully and emit RebalanceExecuted", async function () {
        const amountIn = 100n * 10n ** 18n;
        const amountOutMin = 49;
        const path = [tokenA.address, tokenB.address];
        const reason = "Testing rebalance";
        const executor = deployer.account.address;
        const eventSignatureString = "RebalanceExecuted(address,address,address,address,uint256,uint256,string,uint256)";
        const eventSignatureBytes = toBytes(eventSignatureString);
        // Compute keccak256 hash
        const eventSignature = keccak256(eventSignatureBytes);



        // Set allocation
        const tokens = [tokenA.address, tokenB.address];
        const percents = [60, 40];
        await portfolio.write.setAllocation([tokens, percents], { account: user.account });

        // Execute rebalance and check event
        try {
            const tx = await portfolio.write.executeRebalance(
                [executor, tokenA.address, tokenB.address, amountIn, amountOutMin, path, reason],
                { account: user.account }
            );
            const receipt = await publicClient.waitForTransactionReceipt({ hash: tx });

            assert.equal(
                receipt.logs.some(log => log.topics[0] === eventSignature),
                true,
                "RebalanceExecuted event not emitted"
            );

            // Verify user received tokenB
            const balanceB = await tokenB.read.balanceOf([user.account.address]);
            assert(balanceB >= 1000n, `User should have received at least 1000 tokenB, got ${balanceB}`);
        } catch (error) {
            // @ts-ignore
            assert.fail(`executeRebalance failed: ${error.message}`);
        }
    });
});