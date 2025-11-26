// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title TestWETH
 * @notice Wrapped Ether-like test token for testnet deployment
 * @dev 18 decimals to match real WETH
 */
contract TestWETH is ERC20, ERC20Burnable, ERC20Pausable, Ownable {
    constructor(
        address initialOwner
    ) ERC20("Test Wrapped Ether", "WETH") Ownable(initialOwner) {
        // Mint initial supply: 10,000 WETH
        _mint(initialOwner, 10_000 * 10 ** 18);
    }

    /**
     * @notice Mint tokens to any address (testnet only)
     * @param to Recipient address
     * @param amount Amount to mint (in token units, not wei)
     */
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount * 10 ** 18);
    }

    /**
     * @notice Mint exact amount with decimals
     * @param to Recipient address
     * @param amount Exact amount including decimals
     */
    function mintExact(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }

    /**
     * @notice Pause all token transfers
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @notice Unpause token transfers
     */
    function unpause() external onlyOwner {
        _unpause();
    }

    /**
     * @dev Required override for ERC20Pausable
     */
    function _update(
        address from,
        address to,
        uint256 value
    ) internal override(ERC20, ERC20Pausable) {
        super._update(from, to, value);
    }
}
