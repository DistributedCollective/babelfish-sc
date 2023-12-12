// SPDX-License-Identifier: MIT
pragma solidity ^0.5.17;

import { Ownable } from "../openzeppelin/contracts/ownership/Ownable.sol";

contract TestOwnable is Ownable {

    string version;

    constructor() public {
        version = "0.0";
    }

    function getVersion() public view returns (string memory) {
        return version;
    }

    function setVersion(string memory newVersion) public onlyOwner {
        version = newVersion;
    }
}
