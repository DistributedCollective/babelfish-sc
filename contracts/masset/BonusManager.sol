// SPDX-License-Identifier: MIT
pragma solidity ^0.5.17;

import "../openzeppelin/contracts/ownership/Ownable.sol";
import "../openzeppelin/contracts/token/ERC20/SafeERC20.sol";
import "../openzeppelin/contracts/token/ERC20/IERC20.sol";
import "../openzeppelin/contracts/math/SafeMath.sol";

import "./IRewardManager.sol";
import "./IMasset.sol";

/// @title A holder of bonus funds that can be called by masset to send bonus to depositors
/// @author Derek Matter
contract BonusManager is Ownable {
    using SafeMath for uint256;

    uint256 constant ONE = 1e18;

    /** State **/

    address private massetAddress;
    uint256 private amountMultiplier;
    uint256 private rewardMultiplier;
    uint256 private maximumBonus;
    mapping(address => bool) private tokensMap;
    address[] private tokens;
    bool private paused;
    uint256 private minimumAmount;

    /** Events **/

    event onAmountMultiplierChanged(address indexed sender, uint256 amountMultiplier);
    event onRewardMultiplierChanged(address indexed sender, uint256 rewardMultiplier);
    event onMaximumBonusChanged(address indexed sender, uint256 maximumBonus);
    event onTokensChanged(address indexed sender, address[] tokens);
    event onPausedChanged(address indexed sender, bool paused);
    event onMinimumAmountChanged(address indexed sender, uint256 minimumAmount);
    event onBonusSent(address indexed recipient, uint256 amount);

    constructor(
        address _massetAddress) public {
        require(_massetAddress != address(0), "invalid masset");
        massetAddress = _massetAddress;
    } 

    /** Getters for all **/

    function getVersion() external pure returns (string memory) {
        return "1.0";
    }

    function getMassetAddress() public view returns (address) {
        return massetAddress;
    }

    function getAmountMultiplier() public view returns (uint256) {
        return amountMultiplier;
    }

    function getRewardMultiplier() public view returns (uint256) {
        return rewardMultiplier;
    }

    function getMaximumBonus() public view returns (uint256) {
        return maximumBonus;
    }

    function getMinimumAmount() public view returns (uint256) {
        return minimumAmount;
    }

    function getTokens() public view returns (address[] memory) {
        return tokens;
    }

    function isPaused() public view returns(bool) {
        return paused;
    }

    /** Setters for owner only **/

    /**
     * @dev Set factor for amount based bonus
     * @param _amountMultiplier      Multiplier in the range 0 to 1e18
     */
    function setAmountMultiplier(uint256 _amountMultiplier) external onlyOwner {
        require(_amountMultiplier <= ONE, "invalid factor");
        amountMultiplier = _amountMultiplier;
        emit onAmountMultiplierChanged(msg.sender, amountMultiplier);
    }

    /**
     * @dev Set factor for reward based bonus
     * @param _rewardMultiplier      Multiplier in the range 0 to 1e18
     */
    function setRewardMultiplier(uint256 _rewardMultiplier) external onlyOwner {
        require(_rewardMultiplier <= ONE, "invalid factor");
        rewardMultiplier = _rewardMultiplier;
        emit onAmountMultiplierChanged(msg.sender, rewardMultiplier);
    }

    /**
     * @dev Set maximum amount of bonus to pay in one tx
     * @param _maximumBonus      Maximum bonus amount
     */
    function setMaximumBonus(uint256 _maximumBonus) external onlyOwner {
        maximumBonus = _maximumBonus;
        emit onMaximumBonusChanged(msg.sender, maximumBonus);
    }

    /**
     * @dev Set minimum amount or deposit for which bonus is paid
     * @param _minimumAmount      Minimum amount
     */
    function setMinimumAmount(uint256 _minimumAmount) external onlyOwner {
        minimumAmount = _minimumAmount;
        emit onMinimumAmountChanged(msg.sender, minimumAmount);
    }

    /**
     * @dev Set a whitelist of tokens for which a bonus is paid
     * @param _tokens      Token addresses
     */
    function setTokens(address[] calldata _tokens) external onlyOwner {
        uint tokenCount = tokens.length;
        for(uint i=0; i<tokenCount; ++i) {
            tokensMap[tokens[i]] = false;
        }
        tokens = _tokens;
        tokenCount = tokens.length;
        for(uint i=0; i<tokenCount; ++i) {
            tokensMap[tokens[i]] = true;
        }
        emit onTokensChanged(msg.sender, tokens);
    }

    /**
     * @dev This allows pausing the contract so that all bonuses will be 0 until unpaused
     * @param _paused      Whether paused or not
     */
    function setPaused(bool _paused) external onlyOwner {
        paused = _paused;
        emit onPausedChanged(msg.sender, paused);
    }

    /*****  Method to extract funds, owner only */

    /**
     * @dev Owner can extract funds that were mistakenly sent here
     * @param _tokenAddress      Address of token
     * @param _amount      Amount to extract
     */
    function extractFunds(address _tokenAddress, uint256 _amount) external onlyOwner {
        SafeERC20.safeTransfer(IERC20(_tokenAddress), owner(), _amount);
    }

    /*****  Method to send bonus, for masset only */

    /**
     * @dev Calculate how much bonus will be paid for given deposit
     * @param _tokenAddress      Address of token
     * @param _amount      Amount of deposit
     */
    function getPredictedBonus(address _tokenAddress, uint256 _amount) public view returns (uint256) {

        if(paused || _amount < minimumAmount || !tokensMap[_tokenAddress]) {
            return 0;
        }

        address rewardManagerAddress = IMasset(massetAddress).getRewardManager();
        uint256 reward = IRewardManager(rewardManagerAddress).getRewardForDeposit(_tokenAddress, _amount, false);

        uint256 amountBonus = amountMultiplier.mul(_amount).div(ONE);
        uint256 rewardBonus = rewardMultiplier.mul(reward).div(ONE);
        uint256 bonus = rewardBonus.add(amountBonus);

        if(bonus == 0) {
            return 0;
        }

        address xusdAddress = IMasset(massetAddress).getToken();
        uint256 balance = IERC20(xusdAddress).balanceOf(address(this));
        if(balance == 0) {
            return 0;
        }

        uint256 penalty = IRewardManager(rewardManagerAddress).getPenaltyForWithdrawal(_tokenAddress, _amount);

        // to prevent abuse, we make sure 
        // that the total reward + bonus do not exceed to potential penalty
        // so that users don't deposit and immediately withdraw to drain
        // the bonus manager of funds

        if(bonus + reward > penalty) {
            bonus = penalty > reward ? penalty - reward : 0;
        }

        if(bonus > maximumBonus) {
            bonus = maximumBonus;
        }

        if(bonus > balance) {
            return balance;
        }

        return bonus;
    }

    /**
     * @dev Send the actual bonus. Can only be called by the masset instance
     * @param _tokenAddress      Address of token
     * @param _recipient      Where to send the bonus
     * @param _amount      Amount of deposit
     */
    function sendBonus(address _tokenAddress, address _recipient, uint256 _amount) external returns (uint256) {
        require(msg.sender == massetAddress, "not allowed");

        uint256 bonus = getPredictedBonus(_tokenAddress, _amount);
        if(bonus > 0) {
            address xusdAddress = IMasset(massetAddress).getToken();
            SafeERC20.safeTransfer(IERC20(xusdAddress), _recipient, bonus);
            emit onBonusSent(_recipient, bonus);
        }

        return bonus;
    }
}
