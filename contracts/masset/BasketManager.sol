// SPDX-License-Identifier: MIT
pragma solidity ^0.5.17;

import { SafeMath } from "../openzeppelin/contracts/math/SafeMath.sol";
import { IERC20 } from "../openzeppelin/contracts/token/ERC20/IERC20.sol";
import { IBasketManager } from "./IBasketManager.sol";
import { Ownable } from "../openzeppelin/contracts/ownership/Ownable.sol";
import { Address } from "../openzeppelin/contracts/utils/Address.sol";


contract BasketManager is IBasketManager, Ownable {

    using SafeMath for uint256;

    /** events */

    event onBassetAdded(address indexed sender, address indexed basset, int256 factor, address bridge);
    event onBassetRemoved(address indexed sender, address indexed basset);

    /** state */

    address[] private bassetsArray;
    mapping(address => bool) private bassetsMap;
    mapping(address => int256) private factorMap;
    mapping(address => address) private bridgeMap;

    /** internal methods */

    function _isValidBasset(address _basset) internal view returns(bool) {
        return _basset != address(0) && bassetsMap[_basset];
    }

    /** public methods */

    constructor(address[] memory _bassets, int256[] memory _factors, address[] memory _bridges) public {
        require(_bassets.length == _factors.length, "factor array length mismatch");
        require(_bridges.length == _factors.length, "bridge array length mismatch");

        for(uint i=0; i<_bassets.length; i++) {
            addBasset(_bassets[i], _factors[i], _bridges[i]);
        }
    }

    function isValidBasset(address _basset) public view returns(bool) {
        return _isValidBasset(_basset);
    }

    function checkBasketBalanceForDeposit(address _basset, uint256 _bassetQuantity) public view returns(bool) {
        assert(_bassetQuantity >= 0);
        return _isValidBasset(_basset);
    }

    function checkBasketBalanceForWithdrawal(address _basset, uint256 _bassetQuantity) public view returns(bool) {
        assert(_bassetQuantity >= 0);
        return _isValidBasset(_basset);
    }

    function convertBassetToMassetQuantity(address _basset, uint256 _bassetQuantity) public view returns(uint256) {
        require(_isValidBasset(_basset), "invalid basset");
        int256 factor = factorMap[_basset];
        if(factor > 0) {
            return _bassetQuantity.div(uint256(factor));
        }
        return _bassetQuantity.mul(uint256(-factor));
    }

    function convertMassetToBassetQuantity(address _basset, uint256 _massetQuantity) public view returns(uint256) {
        require(_isValidBasset(_basset), "invalid basset");
        int256 factor = factorMap[_basset];
        if(factor > 0) {
            return _massetQuantity.mul(uint256(factor));
        }
        return _massetQuantity.div(uint256(-factor));
    }

    function getBassets() public view returns (address[] memory) {
        return bassetsArray;
    }

    function getFactor(address _basset) public view returns (int256) {
        return factorMap[_basset];
    }

    function getBridge(address _basset) public view returns(address) {
        return bridgeMap[_basset];
    }

    function getVersion() public pure returns(string memory) {
        return "4.0";
    }

    /*** for incentive curve  */

    function getBalanceInMasset(address _massetAddress, address _bassetAddress) public view returns (uint256) {
        uint256 balanceInBasset = IERC20(_bassetAddress).balanceOf(_massetAddress);
        return convertBassetToMassetQuantity(_bassetAddress, balanceInBasset);
    }

    function getTotalBalanceInMasset(address _massetAddress) public view returns (uint256) {
        uint256 total = 0;
        for(uint i = 0; i < bassetsArray.length; i++) {
            total += getBalanceInMasset(_massetAddress, bassetsArray[i]);
        }
        return total;
    }

    /** mutating methods */

    function addBasset(address _basset, int256 _factor, address _bridge) public onlyOwner {
        require(Address.isContract(_basset), "invalid _basset");
        require(!_isValidBasset(_basset), "_basset already exists");
        require(_factor != 0, "invalid _factor");

        bassetsMap[_basset] = true;
        factorMap[_basset] = _factor;
        bridgeMap[_basset] = _bridge;
        bassetsArray.push(_basset);

        emit onBassetAdded(msg.sender, _basset, _factor, _bridge);
    }

    function removeBasset(address _basset) public onlyOwner {
        require(_isValidBasset(_basset), "invalid _basset");
        bassetsMap[_basset] = false;
        for(uint i=0; i<bassetsArray.length; i++) {
            if(bassetsArray[i] == _basset) {
                bassetsArray[i] = bassetsArray[bassetsArray.length-1];
                bassetsArray.length--;
            }
        }

        emit onBassetRemoved(msg.sender, _basset);
    }
}
