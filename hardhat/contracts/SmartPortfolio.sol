// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// Hardhat-ready contract: uses OpenZeppelin libraries
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

interface IUniswapV2Router {
    function swapExactTokensForTokens(
        uint amountIn,
        uint amountOutMin,
        address[] calldata path,
        address to,
        uint deadline
    ) external returns (uint[] memory amounts);

    function getAmountsOut(uint amountIn, address[] calldata path) external view returns (uint[] memory amounts);
}

contract SmartPortfolioAA is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    /// ------------------------
    /// Events
    /// ------------------------
    event AllocationSet(address indexed user, uint16 usdtPct, uint16 ethPct, uint16 otherPct);
    event RebalanceExecuted(
        address indexed user,
        address indexed executor,
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        uint256 amountOut,
        string reason,
        uint256 timestamp
    );
    event Paused(address indexed by);
    event Unpaused(address indexed by);

    /// ------------------------
    /// Storage
    /// ------------------------
    struct Allocation {
        uint16 usdtPercent;
        uint16 ethPercent;
        uint16 otherPercent;
    }

    mapping(address => Allocation) public allocations;

    /// Router (UniswapV2-style)
    IUniswapV2Router public immutable router;

    /// Pause state
    bool public paused;

    /// ------------------------
    /// Constructor
    /// ------------------------
    constructor(address _router) {
        require(_router != address(0), "router=0");
        router = IUniswapV2Router(_router);
    }

    /// ------------------------
    /// Modifiers
    /// ------------------------
    modifier whenNotPaused() {
        require(!paused, "Contract is paused");
        _;
    }

    /// ------------------------
    /// User-facing: set allocation
    /// ------------------------
    /// Caller MUST be the user's smart account (i.e., msg.sender is the smart account).
    function setAllocation(uint16 usdtPct, uint16 ethPct, uint16 otherPct) external {
        require(usdtPct + ethPct + otherPct == 100, "sum must = 100");
        allocations[msg.sender] = Allocation(usdtPct, ethPct, otherPct);
        emit AllocationSet(msg.sender, usdtPct, ethPct, otherPct);
    }

    /// @notice Remove allocation (reset to 0)
    function removeAllocation() external {
        delete allocations[msg.sender];
        emit AllocationSet(msg.sender, 0, 0, 0);
    }

    /// ------------------------
    /// Bot-triggered (via user smart account's executeOnBehalf)
    /// ------------------------
    /**
     * @notice Execute a non-custodial rebalance for the user.
     *
     * Security / flow assumptions:
     * - `msg.sender` is expected to be the user's smart account (this is what executeOnBehalf achieves:
     *    the bot submits a UserOperation signed by the session key; the smart account pays the bundler and
     *    performs the call so the contract sees msg.sender == user's smart account).
     * - Before calling this, the user must have approved this contract to spend `amountIn` of `tokenIn`:
     *    IERC20(tokenIn).approve(contractAddress, amountIn);
     * - The contract will:
     *    1) pull tokenIn from msg.sender via transferFrom
     *    2) approve the router and call swapExactTokensForTokens
     *    3) send the output token(s) back to msg.sender
     *
     * @param executor Optional: address identifying the bot/executor that requested the user operation.
     *                 This value is not enforced by the contract and is purely informational in the event log.
     */
    function executeRebalance(
        address executor,           // informational only, emitted in event
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        uint256 amountOutMin,
        address[] calldata path,
        string calldata reason
    ) external nonReentrant whenNotPaused returns (uint256 amountOut) {
        address user = msg.sender; // user's smart account (caller)

        require(user != address(0), "user=0");
        require(amountIn > 0, "amountIn=0");
        require(path.length >= 2, "path length");
        require(path[0] == tokenIn && path[path.length - 1] == tokenOut, "path mismatch");

        // 1) Pull tokens from user's smart account (user must have approved this contract)
        IERC20(tokenIn).safeTransferFrom(user, address(this), amountIn);

        // 2) Approve router
        IERC20(tokenIn).safeApprove(address(router), amountIn);

        // 3) Execute swap on router, tokens returned to this contract
        uint[] memory amounts = router.swapExactTokensForTokens(
            amountIn,
            amountOutMin,
            path,
            address(this),
            block.timestamp + 300 // 5 minute deadline
        );

        amountOut = amounts[amounts.length - 1];

        // 4) Transfer swapped tokens back to user
        IERC20(tokenOut).safeTransfer(user, amountOut);

        // 5) Reset allowance to 0 for safety (optional -- costs gas)
        IERC20(tokenIn).safeApprove(address(router), 0);

        // 6) Emit event
        // executor argument is informational; it can be the bot EOA or any identifier included in the UserOp's callData
        emit RebalanceExecuted(user, executor, tokenIn, tokenOut, amountIn, amountOut, reason, block.timestamp);
    }

    /// ------------------------
    /// Query Functions (View)
    /// ------------------------

    /// @notice Helper: estimate amounts out (read-only)
    function getEstimatedOut(uint256 amountIn, address[] calldata path) external view returns (uint256[] memory) {
        return router.getAmountsOut(amountIn, path);
    }

    /// @notice Get user's current allocation settings
    function getAllocation(address user) external view returns (uint16 usdtPct, uint16 ethPct, uint16 otherPct) {
        Allocation memory alloc = allocations[user];
        return (alloc.usdtPercent, alloc.ethPercent, alloc.otherPercent);
    }

    /// @notice Check if user has set an allocation
    function hasAllocation(address user) external view returns (bool) {
        Allocation memory alloc = allocations[user];
        return (alloc.usdtPercent + alloc.ethPercent + alloc.otherPercent) == 100;
    }

    /// @notice Batch function to get allocations for multiple users
    function getAllocationsBatch(address[] calldata users) external view returns (Allocation[] memory) {
        Allocation[] memory results = new Allocation[](users.length);
        for (uint i = 0; i < users.length; i++) {
            results[i] = allocations[users[i]];
        }
        return results;
    }

    /// @notice Get contract balance for any token (transparency)
    function getContractBalance(address token) external view returns (uint256) {
        return IERC20(token).balanceOf(address(this));
    }

    /// @notice Validate a rebalance before execution (simulation helper)
    function validateRebalance(
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        uint256 amountOutMin,
        address[] calldata path
    ) external view returns (bool valid, string memory reason) {
        if (paused) return (false, "Contract paused");
        if (amountIn == 0) return (false, "Amount is zero");
        if (path.length < 2) return (false, "Invalid path length");
        if (path[0] != tokenIn) return (false, "Path start mismatch");
        if (path[path.length - 1] != tokenOut) return (false, "Path end mismatch");

        // Check if router would give enough output
        try router.getAmountsOut(amountIn, path) returns (uint[] memory amounts) {
            if (amounts[amounts.length - 1] < amountOutMin) {
                return (false, "Slippage too high");
            }
        } catch {
            return (false, "Router estimation failed");
        }

        return (true, "Valid");
    }

    /// ------------------------
    /// User Safety Functions
    /// ------------------------

    /// @notice Allow users to revoke approval (safety feature)
    function revokeApproval(address token) external {
        IERC20(token).safeApprove(address(this), 0);
    }

    /// ------------------------
    /// Admin Functions (Owner only)
    /// ------------------------

    /// @notice Emergency pause functionality
    function pause() external onlyOwner {
        paused = true;
        emit Paused(msg.sender);
    }

    /// @notice Unpause the contract
    function unpause() external onlyOwner {
        paused = false;
        emit Unpaused(msg.sender);
    }
}