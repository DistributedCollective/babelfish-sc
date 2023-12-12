// SPDX-License-Identifier: MIT
pragma solidity ^0.5.17;

import { Ownable } from "../openzeppelin/contracts/ownership/Ownable.sol";

/// @title A contract to manage pausers and paused tokens
/// @author Derek Matter
contract PauseManager is Ownable {

    /** State **/

    address[] public pauserArray;
    mapping(address => bool) public pauserMap;

    address[] public tokenArray;
    mapping(address => bool) public tokenMap;

    /** Events **/

    event onPause(address indexed sender, address indexed token);
    event onUnpause(address indexed sender, address indexed token);
    event onAddPauser(address indexed sender, address indexed pauser);
    event onRemovePauser(address indexed sender, address indexed pauser);

    /** Modifiers **/

    function isPauser(address _pauser) public view returns (bool) {
        return pauserMap[_pauser];
    }

    modifier onlyPauser() {
        require(isPauser(msg.sender), "not pauser");
        _;
    }

    modifier onlyPauserOrOwner() {
        require(isOwner() || isPauser(msg.sender), "not pauser or owner");
        _;
    }

    function isPaused(address _token) public view returns (bool) {
        return tokenMap[_token];
    }

    /** External methods **/

    /// @notice Get the list of tokens
    /// @return tokens Array of tokens
    function getTokens() external view returns (address[] memory tokens) {
        return tokenArray;
    }

    /// @notice Pause a token. Any pauser or owner can pause a token.
    /// @param _token Address of stabelcoin to pause
    function pause(address _token) external onlyPauserOrOwner {
        require(_token != address(0), "zero address");
        require(!isPaused(_token), "already paused");
        tokenMap[_token] = true;
        tokenArray.push(_token);
        emit onPause(msg.sender, _token);
    }

    /// @notice Un-pause a token. Only the owner can un-pause a token.
    /// @param _token Address of stabelcoin to pause
    function unpause(address _token) external onlyOwner {
        require(isPaused(_token), "not paused");
        tokenMap[_token] = false;
        for(uint i=0; i < tokenArray.length; i++) {
            if(_token == tokenArray[i]) {
                tokenArray[i] = tokenArray[tokenArray.length - 1];
                tokenArray.length--;
            }
        }
        emit onUnpause(msg.sender, _token);
    }

    /// @notice Get the list of pausers
    /// @return pausers Array of addresses
    function getPausers() external view returns (address[] memory pausers) {
        return pauserArray;
    }

    /// @notice Add a pauser to the list
    /// @param _pauser Address of pauser
    function addPauser(address _pauser) external onlyOwner {
        require(_pauser != address(0), "zero address");
        require(!isPauser(_pauser), "already added");
        require(pauserArray.length < 20, "too many pausers (20)");
        pauserMap[_pauser] = true;
        pauserArray.push(_pauser);
        emit onAddPauser(msg.sender, _pauser);
    }

    /// @notice Remove a pauser from the list
    /// @param _pauser Address of pauser
    function removePauser(address _pauser) external onlyOwner {
        require(isPauser(_pauser), "not found");
        pauserMap[_pauser] = false;
        for(uint i=0; i < pauserArray.length; i++) {
            if(_pauser == pauserArray[i]) {
                pauserArray[i] = pauserArray[pauserArray.length - 1];
                pauserArray.length--;
            }
        }
        emit onRemovePauser(msg.sender, _pauser);
    }
}
