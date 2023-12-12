// SPDX-License-Identifier: MIT
pragma solidity ^0.5.17;

import { Ownable } from "../openzeppelin/contracts/ownership/Ownable.sol";

contract MappingAddressToUint256 is Ownable {

    mapping(address => uint256) private values;
    mapping(address => bool) private flags;
    address[] private keys;

    constructor() public {
    }

    /** getters */

    function get(address _address) public view returns(uint256) {
        return values[_address];
    }

    function getKeys() public view returns(address[] memory) {
        return keys;
    }

    function getValues() public view returns(uint256[] memory) {
        uint256[] memory r = new uint256[](keys.length);
        // CAVEAT: if the number of keys exceeds a certain limit, this function
        // will no longer be able to run within the limits of a single transaction
        for(uint i=0; i<r.length; i++) {
            r[i] = values[keys[i]];
        }
        return r;
    }

    function exists(address _address) public view returns(bool) {
        return flags[_address];
    }

    /** setters */

    function set(address _address, uint256 _value) public onlyOwner {
        values[_address] = _value;
        if(!flags[_address]) {
            keys.push(_address);
            flags[_address] = true;
        }
    }
}
