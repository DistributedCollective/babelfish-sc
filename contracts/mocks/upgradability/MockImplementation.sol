// SPDX-License-Identifier: MIT
pragma solidity ^0.5.17;

contract MockImplementationV1 {
    string public version = "";
    uint256 public uintVal = 1;
    address private proxyAdmin;

    modifier onlyProxyAdmin() {
        require(msg.sender == proxyAdmin, "Only proxyAdmin can execute");
        _;
    }

    function initialize(address _proxyAdmin) public {
        version = "V1";
        uintVal = 2;
        // Initialize the proxy address (DelayedProxyAdmin's address)
        proxyAdmin = _proxyAdmin;
    }
}

contract MockImplementationV2 {
    string public version = "";
    uint256 public uintVal = 1;
    address private proxyAdmin;

    modifier onlyProxyAdmin() {
        require(msg.sender == proxyAdmin, "Only proxyAdmin can execute");
        _;
    }

    function initializeV2() public payable onlyProxyAdmin {
        // function is payable to test
        version = "V2";
        uintVal = 3;
    }
}

contract MockImplementationV3 {
    string public version = "";
    uint256 public uintVal = 1;
    address private proxyAdmin;

    modifier onlyProxyAdmin() {
        require(msg.sender == proxyAdmin, "Only proxyAdmin can execute");
        _;
    }

    function initializeV3() public payable onlyProxyAdmin {
        // function is payable to test
        version = "V3";
        uintVal = 4;
    }
}
