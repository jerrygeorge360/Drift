// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IERC20 {
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
    function approve(address spender, uint256 amount) external returns (bool);
}

// Minimal UniswapV2 Router interface
interface IUniswapV2Router {
    function swapExactTokensForTokens(
        uint amountIn,
    uint amountOutMin,
    address[] calldata path,
    address to,
    uint deadline
    ) external returns (uint[] memory amounts);
}

contract PortfolioManager {
    address public owner;
    address public agent;
    IUniswapV2Router public router;

    struct Allocation {
        uint256 usdtPercent;
        uint256 ethPercent;
        uint256 otherPercent;
    }

    Allocation public target;
    mapping(address => bool) public allowedTokens;

    event AllocationUpdated(uint256 usdt, uint256 eth, uint256 other);
    event RebalanceExecuted(address indexed user, string reason, uint256 timestamp);

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    modifier onlyAgent() {
        require(msg.sender == agent, "Not agent");
        _;
    }

    constructor(address _router) {
        owner = msg.sender;
        router = IUniswapV2Router(_router);
    }

    // ---- CONFIG ----
    function setAllocation(uint256 usdt, uint256 eth, uint256 other) external onlyOwner {
        require(usdt + eth + other == 100, "Must total 100%");
        target = Allocation(usdt, eth, other);
        emit AllocationUpdated(usdt, eth, other);
    }

    function setAgent(address _agent) external onlyOwner {
        agent = _agent;
    }

    function allowToken(address token, bool status) external onlyOwner {
        allowedTokens[token] = status;
    }

    // ---- REBALANCING ----
    function rebalance(
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        uint256 minOut,
        string calldata reason
) external onlyAgent {
        require(allowedTokens[tokenIn] && allowedTokens[tokenOut], "Token not allowed");

        // Approve router to spend tokens
        IERC20(tokenIn).approve(address(router), amountIn);

        // Build swap path (tokenIn -> tokenOut)
        address ;
        path[0] = tokenIn;
        path[1] = tokenOut;

        // Execute swap
        router.swapExactTokensForTokens(
            amountIn,
            minOut,
            path,
            address(this), // tokens come back to this contract
            block.timestamp
        );

        emit RebalanceExecuted(owner, reason, block.timestamp);
    }

    // ---- UTILS ----
    function getBalance(address token) public view returns (uint256) {
        return IERC20(token).balanceOf(address(this));
    }
}

