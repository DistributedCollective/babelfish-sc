// SPDX-License-Identifier: MIT
pragma solidity ^0.5.17;

import { SafeMath } from "../openzeppelin/contracts/math/SafeMath.sol";
import { IERC20 } from "../openzeppelin/contracts/token/ERC20/IERC20.sol";
import { IBasketManager } from "./IBasketManager.sol";
import { Ownable } from "../openzeppelin/contracts/ownership/Ownable.sol";
import { Address } from "../openzeppelin/contracts/utils/Address.sol";


contract BasketManager is IBasketManager, Ownable {

    /** events */

    event onBassetAdded(address indexed sender, address indexed basset, int256 factor, address bridge);
    event onBassetRemoved(address indexed sender, address indexed basset);

    /** state */

    address[] private bassetsArray;
    mapping(address => bool) private bassetsMap;
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

    function getBassets() public view returns (address[] memory) {
        return bassetsArray;
    }

    function getBridge(address _basset) public view returns(address) {
        return bridgeMap[_basset];
    }

    function getVersion() public pure returns(string memory) {
        return "5.0";
    }

    /** mutating methods */

    function setBassets(address[] memory _bassets, int256[] memory _factors, address[] memory _bridges) public onlyOwner {
        require(_bassets.length == _factors.length, "factor array length mismatch");
        require(_bridges.length == _factors.length, "bridge array length mismatch");

        for(uint i=0; i<bassetsArray.length; i++) {
            removeBasset(bassetsArray[i]);
        }
        for(uint i=0; i<_bassets.length; i++) {
            addBasset(_bassets[i], _factors[i], _bridges[i]);
        }
    }

    function addBasset(address _basset, int256 _factor, address _bridge) public onlyOwner {
        require(Address.isContract(_basset), "invalid _basset");
        require(!_isValidBasset(_basset), "_basset already exists");
        require(_factor == 1, "invalid _factor");

        bassetsMap[_basset] = true;
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
