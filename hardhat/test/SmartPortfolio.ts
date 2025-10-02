import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { network } from "hardhat";

// Mock tokens & router contracts assumed deployed
// Contracts: MockERC20, MockRouter, Rebalancer

describe("Rebalancer Delegation Flow", async () => {
    const { viem } = await network.connect();
    const publicClient = await viem.getPublicClient();

    it("Should simulate approve → delegate → executeRebalance", async () => {
        // Deploy mock tokens
        const tokenA = await viem.deployContract("MockERC20", ["TokenA", "TKA", 18]);
        const tokenB = await viem.deployContract("MockERC20", ["TokenB", "TKB", 18]);

        // Deploy mock router (simulates swaps)
        const router = await viem.deployContract("MockRouter", []);

        // Deploy rebalancer contract (non-custodial, bot executes swaps via router)
        const rebalancer = await viem.deployContract("Rebalancer", [router.address]);

        // Accounts
        const [user, bot] = await viem.getWalletClients();
        const userAddress = user.account.address;

        // Mint tokens to user
        await tokenA.write.mint([userAddress, 1000n * 10n ** 18n]);

        // User approves Rebalancer (via smart account delegation in real MetaMask flow)
        await tokenA.write.approve([rebalancer.address, 1000n * 10n ** 18n], { account: user });

        // User sets allocations (e.g., 50% A → B)
        await rebalancer.write.setAllocation(
            [[tokenA.address, tokenB.address, 50n]], // example allocation rule
            { account: user }
        );

        // Bot executes rebalance on behalf of user
        await rebalancer.write.executeRebalance([userAddress], { account: bot });

        // Read balances after swap
        const balA = await tokenA.read.balanceOf([userAddress]);
        const balB = await tokenB.read.balanceOf([userAddress]);

        // Assertions (mock router swaps all 50% of TokenA to TokenB)
        assert.equal(balA < 1000n * 10n ** 18n, true, "User should spend some TokenA");
        assert.equal(balB > 0n, true, "User should receive TokenB");
    });

    it("Should emit AllocationSet and RebalanceExecuted events", async () => {
        const tokenA = await viem.deployContract("MockERC20", ["TokenA", "TKA", 18]);
        const tokenB = await viem.deployContract("MockERC20", ["TokenB", "TKB", 18]);
        const router = await viem.deployContract("MockRouter", []);
        const rebalancer = await viem.deployContract("Rebalancer", [router.address]);

        const [user, bot] = await viem.getWalletClients();
        const userAddress = user.account.address;

        await tokenA.write.mint([userAddress, 500n * 10n ** 18n]);
        await tokenA.write.approve([rebalancer.address, 500n * 10n ** 18n], { account: user });

        const deploymentBlock = await publicClient.getBlockNumber();

        // Set allocation
        await rebalancer.write.setAllocation(
            [[tokenA.address, tokenB.address, 100n]],
            { account: user }
        );

        // Bot executes
        await rebalancer.write.executeRebalance([userAddress], { account: bot });

        // Check events
        const events = await publicClient.getContractEvents({
            address: rebalancer.address,
            abi: rebalancer.abi,
            fromBlock: deploymentBlock,
            strict: true,
        });

        const names = events.map(e => e.eventName);
        assert.equal(names.includes("AllocationSet"), true, "AllocationSet event missing");
        assert.equal(names.includes("RebalanceExecuted"), true, "RebalanceExecuted event missing");
    });
});
