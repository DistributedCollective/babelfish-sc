// SPDX-License-Identifier: MIT
pragma solidity ^0.5.17;

import { IBasketManager } from "../../masset/IBasketManager.sol";

contract MockBasketManager is IBasketManager {

    mapping(address => bool) private bassetsMap;
    mapping(address => uint256) private balances;
    uint256 private totalBalance;
    address[] bassets;

    function setValidBasset(address _basset, bool _flag) public {
        bassetsMap[_basset] = _flag;
        bassets.push(_basset);
    }

    function isValidBasset(address _basset) external view returns(bool) {
        return bassetsMap[_basset];
    }

    function getBridge(address _basset) external view returns(address) {
        assert(_basset != 0x0000000000000000000000000000000000000000);
        return 0x0000000000000000000000000000000000000000;
    }

    function getVersion() external pure returns(string memory) {
        return "4.0";
    }

    function getBassets() external view returns (address[] memory) {
        return bassets;
    }
}
