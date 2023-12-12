// SPDX-License-Identifier: MIT
pragma solidity ^0.5.17;

contract IOwnable {
    function owner() public view returns (address);
    function isOwner() public view returns (bool);
    function renounceOwnership() public;
    function transferOwnership(address newOwner) public;
}
