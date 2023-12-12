// SPDX-License-Identifier: MIT
pragma solidity ^0.5.17;

import "../openzeppelin/contracts/token/ERC20/ERC20.sol";
import "../openzeppelin/contracts/token/ERC20/ERC20Detailed.sol";
import "../helpers/InitializableOwnable.sol";
import "../helpers/InitializableERC20Detailed.sol";

contract Token is ERC20, InitializableERC20Detailed, InitializableOwnable {

    /**
     * @notice initialize called on deployment, initiates the contract.
     * @param _name The name of the token.
     * @param _symbol The symbol of the token.
     * @param _decimals The decimals of the token.
     * */

    function initialize(string memory _name, string memory _symbol, uint8 _decimals) public {
        InitializableERC20Detailed.initialize(_name, _symbol, _decimals);
        InitializableOwnable._initialize();
    }

    /**
     * @notice Creates new tokens and sends them to the recipient.
     * @param _account The recipient address to get the minted tokens.
     * @param _amount The amount of tokens to be minted.
     * */
    function mint(address _account, uint256 _amount) public onlyOwner {
        _mint(_account, _amount);
    }

    /**
     * @notice Burns tokens for the given account.
     * @param _account The recipient address to get the minted tokens.
     * @param _amount The amount of tokens to be minted.
     * */
    function burn(address _account, uint256 _amount) public onlyOwner {
        _burn(_account, _amount);
    }
}
