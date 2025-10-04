// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract MockRouter {
    using SafeERC20 for IERC20;

    bool public shouldFail;
    uint256 public fixedOut = 1000; // Default output amount for testing

    event SwapExecuted(address indexed fromToken, address indexed toToken, uint256 amountIn, uint256 amountOut);

    function setFail(bool _shouldFail) external {
        shouldFail = _shouldFail;
    }

    function setFixedOut(uint256 _amount) external {
        fixedOut = _amount;
    }

    function swapExactTokensForTokens(
        uint amountIn,
        uint amountOutMin,
        address[] calldata path,
        address to,
        uint deadline
    ) external returns (uint[] memory amounts) {
        require(!shouldFail, "MockRouter: fail");
        require(block.timestamp <= deadline, "MockRouter: expired");
        require(path.length >= 2, "MockRouter: invalid path");
        require(amountOutMin <= fixedOut, "MockRouter: insufficient output");

        amounts = new uint[](2);
        amounts[0] = amountIn;
        amounts[1] = fixedOut;

        IERC20(path[0]).safeTransferFrom(msg.sender, address(this), amountIn);
        IERC20(path[path.length - 1]).safeTransfer(to, fixedOut);

        emit SwapExecuted(path[0], path[path.length - 1], amountIn, fixedOut);
    }

    function getAmountsOut(uint amountIn, address[] calldata path)
    external view returns (uint[] memory amounts)
    {
        require(!shouldFail, "MockRouter: fail");
        require(path.length >= 2, "MockRouter: invalid path");
        amounts = new uint[](2);
        amounts[0] = amountIn;
        amounts[1] = fixedOut;
    }
}