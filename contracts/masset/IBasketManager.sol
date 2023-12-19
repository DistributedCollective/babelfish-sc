// SPDX-License-Identifier: MIT
pragma solidity ^0.5.17;

import { SafeMath } from "../openzeppelin/contracts/math/SafeMath.sol";
import { IERC20 } from "../openzeppelin/contracts/token/ERC20/IERC20.sol";

interface IBasketManager {

    function isValidBasset(address _basset) external view returns(bool);
    function getBridge(address _basset) external view returns(address);
    function getVersion() external pure returns(string memory);
    function getTotalBalanceInMasset(address _massetAddress) external view returns (uint256);
    function getBassets() external view returns (address[] memory);
}
