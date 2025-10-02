// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract MockRouter {
    function swapExactTokensForTokens(
        uint amountIn,
        uint,
        address[] calldata path,
        address to,
        uint
    ) external returns (uint[] memory amounts) {
        IERC20 tokenIn = IERC20(path[0]);
        IERC20 tokenOut = IERC20(path[path.length - 1]);

        require(tokenIn.transferFrom(msg.sender, address(this), amountIn), "transferFrom fail");
        // mint equivalent output for simplicity
        uint amountOut = amountIn;
        require(tokenOut.transfer(to, amountOut), "transfer fail");

        amounts = new uint ;
        amounts[0] = amountIn;
        amounts[1] = amountOut;
    }

    function getAmountsOut(uint amountIn, address[] calldata) external pure returns (uint[] memory amounts) {
        amounts = new uint ;
        amounts[0] = amountIn;
        amounts[1] = amountIn; // 1:1 swap for simplicity
    }
}
