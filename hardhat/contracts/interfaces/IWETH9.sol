// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title IWETH9
 * @notice Interface for WETH9 (Wrapped Ether) contract
 * @dev Also works for WMON (Wrapped MON) which uses the same interface
 */
interface IWETH9 {
    function deposit() external payable;
    function withdraw(uint256 amount) external;
    function balanceOf(address account) external view returns (uint256);
    function approve(address spender, uint256 amount) external returns (bool);
    function transfer(address to, uint256 amount) external returns (bool);
}
