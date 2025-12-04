pragma solidity ^0.8.21;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title MockERC20
 * @notice Simple ERC20 token for testing on Somnia testnet
 */
contract MockERC20 is ERC20, Ownable {
    uint8 private _decimals;

    constructor(
        string memory name,
        string memory symbol,
        uint8 decimals_,
        uint256 initialSupply
    ) ERC20(name, symbol) Ownable(msg.sender) {
        _decimals = decimals_;
        _mint(msg.sender, initialSupply);
    }

    function decimals() public view virtual override returns (uint8) {
        return _decimals;
    }

    /**
     * @notice Mint new tokens (only owner)
     */
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }

    /**
     * @notice Burn tokens
     */
    function burn(uint256 amount) external {
        _burn(msg.sender, amount);
    }

    /**
     * @notice Faucet function - anyone can mint small amounts for testing
     */
    function faucet() external {
        uint256 amount = 1000 * (10 ** decimals());
        _mint(msg.sender, amount);
    }
}
