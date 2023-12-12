// SPDX-License-Identifier: MIT
pragma solidity ^0.5.17;

import { IBasketManager } from "../../masset/IBasketManager.sol";

contract MockBasketManager is IBasketManager {

    mapping(address => bool) private bassetsMap;
    mapping(address => uint256) private balances;
    uint256 private totalBalance;

    function setValidBasset(address _basset, bool _flag) public {
        bassetsMap[_basset] = _flag;
    }

    function isValidBasset(address _basset) external view returns(bool) {
        return bassetsMap[_basset];
    }

    function checkBasketBalanceForDeposit(address _basset, uint256 _bassetQuantity) external view returns(bool) {
        assert(_basset != 0x0000000000000000000000000000000000000000);
        assert(_bassetQuantity >= 0);
        return true;
    }

    function checkBasketBalanceForWithdrawal(address _basset, uint256 _bassetQuantity) external view returns(bool) {
        assert(_basset != 0x0000000000000000000000000000000000000000);
        assert(_bassetQuantity >= 0);
        return true;
    }

    function convertBassetToMassetQuantity(address _basset, uint256 _bassetQuantity) external view returns(uint256) {
        assert(_basset != 0x0000000000000000000000000000000000000000);
        return _bassetQuantity;
    }

    function convertMassetToBassetQuantity(address _basset, uint256 _massetQuantity) external view returns(uint256) {
        assert(_basset != 0x0000000000000000000000000000000000000000);
        return _massetQuantity;
    }

    function getBridge(address _basset) external view returns(address) {
        assert(_basset != 0x0000000000000000000000000000000000000000);
        return 0x0000000000000000000000000000000000000000;
    }

    function getFactor(address _basset) external view returns(int256) {
        assert(_basset != 0x0000000000000000000000000000000000000000);
        return 1;
    }

    function getVersion() external pure returns(string memory) {
        return "4.0";
    }

    function setBalanceInMasset(address _basset, uint256 _balance) public {
        balances[_basset] = _balance;
    }

    function getBalanceInMasset(address _massetAddress, address _bassetAddress) external view returns (uint256) {
        assert(_massetAddress != 0x0000000000000000000000000000000000000000);
        return balances[_bassetAddress];
    }

    function setTotalBalanceInMasset(uint256 _balance) public {
        totalBalance = _balance;
    }

    function getTotalBalanceInMasset(address _massetAddress) external view returns (uint256) {
        assert(_massetAddress != 0x0000000000000000000000000000000000000000);
        return totalBalance;
    }
}
