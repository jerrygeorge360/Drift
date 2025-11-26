// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title TestUSDT
 * @notice Tether-like test token for testnet deployment
 * @dev 6 decimals to match real USDT
 */
contract TestUSDT is ERC20, ERC20Burnable, ERC20Pausable, Ownable {
    uint8 private constant DECIMALS = 6;

    constructor(
        address initialOwner
    ) ERC20("Test Tether USD", "USDT") Ownable(initialOwner) {
        // Mint initial supply: 1 million USDT
        _mint(initialOwner, 1_000_000 * 10 ** DECIMALS);
    }

    /**
     * @notice Mint tokens to any address (testnet only)
     * @param to Recipient address
     * @param amount Amount to mint (in token units, not wei)
     */
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount * 10 ** DECIMALS);
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
     * @notice Override decimals to return 6 (like real USDT)
     */
    function decimals() public pure override returns (uint8) {
        return DECIMALS;
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
