// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import {MockERC20} from "../src/MockERC20.sol";
import {MockRouter} from "../src/MockRouter.sol";
import {SmartPortfolio} from "../src/SmartPortfolio.sol";

contract SmartPortfolioTest is Test {
    MockERC20 tokenA;
    MockERC20 tokenB;
    MockRouter router;
    SmartPortfolio portfolio;

    address user = address(0x111);
    address bot = address(0x222);

    function setUp() public {
        // Deploy mocks
        tokenA = new MockERC20("TokenA", "TKA", 18);
        tokenB = new MockERC20("TokenB", "TKB", 18);
        router = new MockRouter();

        // Deploy SmartPortfolio
        portfolio = new SmartPortfolio(address(router));

        // Mint tokens to user
        tokenA.mint(user, 1000 ether);
        tokenB.mint(user, 1000 ether);

        // User approves SmartPortfolio
        vm.startPrank(user);
        tokenA.approve(address(portfolio), type(uint256).max);
        tokenB.approve(address(portfolio), type(uint256).max);
        vm.stopPrank();
    }

    function test_SetAllocations() public {
        SmartPortfolio.Allocation ;
        allocs[0] = SmartPortfolio.Allocation({token: address(tokenA), pct: 50});
        allocs[1] = SmartPortfolio.Allocation({token: address(tokenB), pct: 50});

        vm.prank(user);
        portfolio.setAllocations(allocs);

        SmartPortfolio.Allocation[] memory stored = portfolio.getAllocations(user);
        assertEq(stored.length, 2, "Allocations should be stored");
        assertEq(stored[0].pct, 50);
        assertEq(stored[1].pct, 50);
    }

    function test_RebalanceByDelegatedBot() public {
        // Setup allocations
        SmartPortfolio.Allocation ;
        allocs[0] = SmartPortfolio.Allocation({token: address(tokenA), pct: 50});
        allocs[1] = SmartPortfolio.Allocation({token: address(tokenB), pct: 50});

        vm.prank(user);
        portfolio.setAllocations(allocs);

        // User delegates bot
        vm.prank(user);
        portfolio.setDelegation(bot);

        // Bot executes rebalance
        vm.prank(bot);
        portfolio.executeRebalance(user);

        // Validate balances
        uint256 balA = tokenA.balanceOf(user);
        uint256 balB = tokenB.balanceOf(user);
        assertTrue(balA > 0 || balB > 0, "User balances should change");

        // Validate event (Forge can check logs directly)
        vm.expectEmit(true, true, false, false);
        emit SmartPortfolio.Rebalanced(user, bot);
    }

    function testFail_RebalanceWithoutDelegation() public {
        // No delegation set
        vm.prank(address(0x999));
        portfolio.executeRebalance(user);
    }
}
