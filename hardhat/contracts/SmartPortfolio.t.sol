// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import "forge-std/Test.sol";
import "./SmartPortfolio.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/// --------------------------------------------------------
/// Mock ERC20 Token for Testing
/// --------------------------------------------------------
contract MockToken is ERC20 {
    constructor(string memory name, string memory symbol) ERC20(name, symbol) {
        _mint(msg.sender, 1_000_000 ether);
    }

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}

/// --------------------------------------------------------
/// Mock Router for Testing Uniswap-like behavior
/// --------------------------------------------------------
contract MockRouter is IUniswapV2Router {
    uint256 public fixedOut = 1000;

    function setFixedOut(uint256 amount) external {
        fixedOut = amount;
    }

    function swapExactTokensForTokens(
        uint amountIn,
        uint amountOutMin,
        address[] calldata,
        address to,
        uint deadline
    ) external override returns (uint[] memory amounts) {
        require(block.timestamp <= deadline, "MockRouter: expired");
        require(amountIn > 0, "MockRouter: zero input");
        require(amountOutMin <= fixedOut, "MockRouter: slippage fail");

        amounts = new uint ;
        amounts[0] = amountIn;
        amounts[1] = fixedOut;

        // Just simulate transfer by ignoring token logic
        return amounts;
    }

    function getAmountsOut(uint amountIn, address[] calldata path)
    external
    pure
    override
    returns (uint[] memory amounts)
    {
        amounts = new uint[](path.length);
        for (uint i = 0; i < path.length; i++) {
            amounts[i] = amountIn + i * 100; // fake increment
        }
    }
}

/// --------------------------------------------------------
/// Test Contract for SmartPortfolioAA
/// --------------------------------------------------------
contract SmartPortfolioAATest is Test {
    SmartPortfolioAA portfolio;
    MockToken tokenA;
    MockToken tokenB;
    MockRouter router;
    address user = address(0x123);

    function setUp() public {
        // Deploy mocks
        router = new MockRouter();
        tokenA = new MockToken("Token A", "TKA");
        tokenB = new MockToken("Token B", "TKB");

        // Deploy main contract
        portfolio = new SmartPortfolioAA(address(router));

        // Mint some tokens to the test user
        tokenA.mint(user, 1_000 ether);
        tokenB.mint(user, 1_000 ether);
    }

    /// -------------------------
    /// 1️⃣ Test Allocation Logic
    /// -------------------------
    function test_SetAllocation() public {
        vm.startPrank(user);

        address ;
        tokens[0] = address(tokenA);
        tokens[1] = address(tokenB);

        uint16 ;
        percents[0] = 60;
        percents[1] = 40;

        portfolio.setAllocation(tokens, percents);
        vm.stopPrank();

        SmartPortfolioAA.TokenAllocation[] memory allocs = portfolio.getAllocation(user);
        assertEq(allocs.length, 2);
        assertEq(allocs[0].token, address(tokenA));
        assertEq(allocs[1].token, address(tokenB));
        assertEq(allocs[0].percent, 60);
        assertEq(allocs[1].percent, 40);
    }

    function test_RevertOnInvalidAllocation() public {
        vm.startPrank(user);

        address ;
        tokens[0] = address(tokenA);
        tokens[1] = address(tokenB);

        uint16 ;
        percents[0] = 70;
        percents[1] = 20; // Total != 100

        vm.expectRevert("sum must = 100");
        portfolio.setAllocation(tokens, percents);

        vm.stopPrank();
    }

    /// -------------------------
    /// 2️⃣ Pause / Unpause Tests
    /// -------------------------
    function test_PauseAndUnpause() public {
        portfolio.pause();
        assertTrue(portfolio.paused());

        portfolio.unpause();
        assertFalse(portfolio.paused());
    }

    /// -------------------------
    /// 3️⃣ Validate Rebalance Logic
    /// -------------------------
    function test_ValidateRebalance() public view {
        address ;
        path[0] = address(tokenA);
        path[1] = address(tokenB);

        (bool valid, string memory reason) = portfolio.validateRebalance(
            address(tokenA),
            address(tokenB),
            1000,
            500,
            path
        );

        require(valid, reason);
    }

    /// -------------------------
    /// 4️⃣ Remove Allocation Test
    /// -------------------------
    function test_RemoveAllocation() public {
        vm.startPrank(user);

        address ;
        tokens[0] = address(tokenA);

        uint16 ;
        percents[0] = 100;

        portfolio.setAllocation(tokens, percents);
        portfolio.removeAllocation();

        SmartPortfolioAA.TokenAllocation[] memory allocs = portfolio.getAllocation(user);
        assertEq(allocs.length, 0);

        vm.stopPrank();
    }
}
