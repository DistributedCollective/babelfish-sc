// SPDX-License-Identifier: MIT
pragma solidity ^0.5.17;

import { SafeMath } from "../openzeppelin/contracts/math/SafeMath.sol";
import { IERC20 } from "../openzeppelin/contracts/token/ERC20/IERC20.sol";

interface IBasketManager {

    function isValidBasset(address _basset) external view returns(bool);
    function checkBasketBalanceForDeposit(address _basset, uint256 _bassetQuantity) external view returns(bool);
    function checkBasketBalanceForWithdrawal(address _basset, uint256 _bassetQuantity) external view returns(bool);
    function convertBassetToMassetQuantity(address _basset, uint256 _bassetQuantity) external view returns(uint256);
    function convertMassetToBassetQuantity(address _basset, uint256 _massetQuantity) external view returns(uint256);
    function getBridge(address _basset) external view returns(address);
    function getFactor(address _basset) external view returns(int256);
    function getVersion() external pure returns(string memory);
    function getBalanceInMasset(address _massetAddress, address _bassetAddress) external view returns (uint256);
    function getTotalBalanceInMasset(address _massetAddress) external view returns (uint256);
}
