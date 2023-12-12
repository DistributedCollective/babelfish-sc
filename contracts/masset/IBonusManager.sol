// SPDX-License-Identifier: MIT
pragma solidity ^0.5.17;

import { IERC20 } from "../openzeppelin/contracts/token/ERC20/IERC20.sol";

interface IBonusManager {

    function getVersion() external returns (string memory);
    
    /*****  Method to send bonus, for masset only */
    function sendBonus(address _token, address _recipient, uint256 _amount) external returns (uint256);
    function getPredictedBonus(address _token, uint256 _amount) external returns (uint256);
}
