// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/// Hardhat-ready contract: uses OpenZeppelin libraries
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/// ---------------------------------------------
/// Uniswap V2 Router Interface
/// ---------------------------------------------
interface IUniswapV2Router {
    function swapExactTokensForTokens(
        uint amountIn,
        uint amountOutMin,
        address[] calldata path,
        address to,
        uint deadline
    ) external returns (uint[] memory amounts);

    function getAmountsOut(uint amountIn, address[] calldata path)
    external view returns (uint[] memory amounts);
}

/// ---------------------------------------------
/// SmartPortfolio: Dynamic Token Allocation Version
/// ---------------------------------------------
contract SmartPortfolio is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    /// ------------------------
    /// Events
    /// ------------------------
    event DynamicAllocationSet(address indexed user, address[] tokens, uint16[] percents);
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
    event ApprovalRevoked(address indexed user, address indexed token);

    /// ------------------------
    /// Storage
    /// ------------------------
    struct TokenAllocation {
        address token;
        uint16 percent; // out of 100
    }

    /// Mapping of user → dynamic token allocation list
    mapping(address => TokenAllocation[]) private _userAllocations;

    /// Router (UniswapV2-style)
    IUniswapV2Router public immutable router;

    /// Pause state
    bool public paused;

    /// ------------------------
    /// Constructor
    /// ------------------------
    constructor(address _router, address initialOwner) Ownable(initialOwner) {
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
    /// User-facing: set allocation (dynamic version)
    /// ------------------------
    function setAllocation(address[] calldata tokens, uint16[] calldata percents) external {
        require(tokens.length == percents.length, "length mismatch");
        require(tokens.length > 0, "no tokens");

        uint256 total;
        delete _userAllocations[msg.sender]; // clear old allocation

        for (uint256 i = 0; i < tokens.length; i++) {
            require(tokens[i] != address(0), "zero token");
            require(percents[i] > 0, "zero percent");
            total += percents[i];

            _userAllocations[msg.sender].push(
                TokenAllocation({token: tokens[i], percent: percents[i]})
            );
        }

        require(total == 100, "sum must = 100");

        emit DynamicAllocationSet(msg.sender, tokens, percents);
    }

    /// @notice Remove allocation (reset to 0)
    function removeAllocation() external {
        delete _userAllocations[msg.sender];
        emit DynamicAllocationSet(msg.sender, new address[](0), new uint16[](0));
    }

    /// ------------------------
    /// Bot-triggered rebalance
    /// ------------------------
    function executeRebalance(
        address executor,           // informational only
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        uint256 amountOutMin,
        address[] calldata path,
        string calldata reason
    ) external nonReentrant whenNotPaused returns (uint256 amountOut) {
        address user = msg.sender;

        require(user != address(0), "user=0");
        require(amountIn > 0, "amountIn=0");
        require(path.length >= 2, "path length");
        require(path[0] == tokenIn && path[path.length - 1] == tokenOut, "path mismatch");

        // 1) Pull tokens from user's smart account
        IERC20(tokenIn).safeTransferFrom(user, address(this), amountIn);

        // 2) Approve router
        IERC20(tokenIn).forceApprove(address(router), amountIn);

        // 3) Execute swap on router
        uint[] memory amounts = router.swapExactTokensForTokens(
            amountIn,
            amountOutMin,
            path,
            address(this),
            block.timestamp + 300 // 5 min deadline
        );

        amountOut = amounts[amounts.length - 1];

        // 4) Transfer swapped tokens back to user
        IERC20(tokenOut).safeTransfer(user, amountOut);

        // 5) Reset allowance for safety
        IERC20(tokenIn).forceApprove(address(router), 0);

        // 6) Emit event
        emit RebalanceExecuted(
            user,
            executor,
            tokenIn,
            tokenOut,
            amountIn,
            amountOut,
            reason,
            block.timestamp
        );
    }

    /// ------------------------
    /// Query Functions (View)
    /// ------------------------

    /// @notice Get estimated output from router
    function getEstimatedOut(uint256 amountIn, address[] calldata path)
    external view returns (uint256[] memory)
    {
        return router.getAmountsOut(amountIn, path);
    }

    /// @notice Get user's dynamic allocation
    function getAllocation(address user)
    external view returns (TokenAllocation[] memory)
    {
        return _userAllocations[user];
    }

    /// @notice Check if user has an allocation (sum = 100)
    function hasAllocation(address user) external view returns (bool) {
        TokenAllocation[] memory allocs = _userAllocations[user];
        if (allocs.length == 0) return false;

        uint256 total;
        for (uint256 i = 0; i < allocs.length; i++) {
            total += allocs[i].percent;
        }
        return total == 100;
    }

    /// @notice Get contract balance for any token (transparency)
    function getContractBalance(address token) external view returns (uint256) {
        return IERC20(token).balanceOf(address(this));
    }

    /// @notice Validate a rebalance before execution
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

        // Check expected output
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
    function revokeApproval(address token) external {
        IERC20(token).forceApprove(address(router), 0);
        emit ApprovalRevoked(msg.sender, token);
    }

    /// ------------------------
    /// Admin Functions
    /// ------------------------
    function pause() external onlyOwner {
        paused = true;
        emit Paused(msg.sender);
    }

    function unpause() external onlyOwner {
        paused = false;
        emit Unpaused(msg.sender);
    }
}