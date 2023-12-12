// SPDX-License-Identifier: MIT
pragma solidity ^0.5.17;

import { BaseAdminUpgradeabilityProxy } from "../openzeppelin/upgrades/contracts/upgradeability/BaseAdminUpgradeabilityProxy.sol";
import { ReentrancyGuard } from "../openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract ThresholdProxyAdmin is ReentrancyGuard {

    // events
    event Proposed(address indexed admin, Action action, address indexed target, bytes data);
    event Retracted(address indexed admin, Action action, address indexed target, bytes data);
    event Accepted(address indexed admin, Action action, address indexed target, bytes data);

    // types

    enum Action { None, Upgrade, ChangeAdmin }

    struct Proposal {
        Action action;
        address target;
        bytes data;
    }

    // state

    uint8 private threshold;
    address payable proxy;
    mapping(address => bool) private admins;
    address[] private adminsArray;
    mapping(address => Proposal) private proposals;

    // internal

    function _isAdmin(address _a) internal view returns (bool) {
        require(_a != address(0), "invalid address");

        return admins[_a];
    }

    modifier adminOnly() {
        require(_isAdmin(msg.sender), "admin only");
        _;
    }

    function _proposalsIdentical(Proposal memory a, Proposal memory b) internal pure returns (bool) {
        return a.target == b.target &&
            a.action == b.action &&
            ( (a.data.length == 0 && b.data.length == 0) ||
                keccak256(abi.encodePacked(a.data)) == keccak256(abi.encodePacked(b.data)) );
    }

    function _countInstances(Proposal memory newProp) internal view returns(uint) {
        uint voters = 0;
        for(uint i=0; i<adminsArray.length; i++) {
            if(_proposalsIdentical(newProp, proposals[adminsArray[i]])) {
                voters++;
            }
        }
        return voters;
    }

    function _acceptProposal(Proposal memory newProp) internal {
        if(newProp.action == Action.Upgrade) {
            if(newProp.data.length == 0) {
                BaseAdminUpgradeabilityProxy(proxy).upgradeTo(newProp.target);
            } else {
                BaseAdminUpgradeabilityProxy(proxy).upgradeToAndCall(newProp.target, newProp.data);
            }
        } else if(newProp.action == Action.ChangeAdmin) {
            BaseAdminUpgradeabilityProxy(proxy).changeAdmin(newProp.target);
        }
        _removeProposal(newProp);
    }

    function _removeProposal(Proposal memory newProp) internal {
        for(uint i=0; i<adminsArray.length; i++) {
            if(_proposalsIdentical(newProp, proposals[adminsArray[i]])) {
                proposals[adminsArray[i]].action = Action.None;
            }
        }
    }

    // external

    constructor(address payable _proxy, address[] memory _admins, uint8 _threshold) public  {
        require(_proxy != address(0), "invalid proxy address");
        require(_admins.length >= 3, "at least 3 admins");
        require(_threshold >= 2 && _threshold <= _admins.length, "invalid threshold");

        proxy = _proxy;
        adminsArray = _admins;
        threshold = _threshold;

        for(uint i=0; i<adminsArray.length; i++) {
            require(adminsArray[i] != address(0), "invalid admin address");
            require(!admins[adminsArray[i]], "unique admin addresses required");
            admins[adminsArray[i]] = true;
        }
    }

    function propose(Action _action, address _target, bytes calldata _data) external adminOnly {
        require(_target != address(0), "invalid target address");
        require(_action != Action.None, "invalid proposal");

        Proposal memory newProp = Proposal({
            action: _action,
            target: _target,
            data: _data
        });

        if (proposals[msg.sender].action != Action.None) {
            require(!_proposalsIdentical(newProp, proposals[msg.sender]), "proposal already exists");
            proposals[msg.sender].action = Action.None;
            emit Retracted(msg.sender, proposals[msg.sender].action, proposals[msg.sender].target, proposals[msg.sender].data);
        }

        proposals[msg.sender] = newProp;

        emit Proposed(msg.sender, _action, _target, _data);
    }

    function retract() external adminOnly {
        require(proposals[msg.sender].action != Action.None, "proposal not found");

        Proposal memory proposal = proposals[msg.sender];

        emit Retracted(msg.sender, proposal.action, proposal.target, proposal.data);

        proposals[msg.sender].action = Action.None;
    }

    function accept() external adminOnly nonReentrant {
        require(proposals[msg.sender].action != Action.None, "proposal not found");

        Proposal memory newProp = proposals[msg.sender];
        require(_countInstances(newProp) >= threshold, "threshold not met");

        _acceptProposal(newProp);

        emit Accepted(msg.sender, newProp.action, newProp.target, newProp.data);
    }

    function getProxy() external view returns (address) {
        return proxy;
    }
}
