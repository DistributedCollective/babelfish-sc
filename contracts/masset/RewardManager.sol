// SPDX-License-Identifier: MIT
pragma solidity ^0.5.17;

import { Ownable } from "../openzeppelin/contracts/ownership/Ownable.sol";
import { SafeMath } from "../openzeppelin/contracts/math/SafeMath.sol";
import { IERC20 } from "../openzeppelin/contracts/token/ERC20/IERC20.sol";
import { Address } from "../openzeppelin/contracts/utils/Address.sol";
import { IBasketManager } from "./IBasketManager.sol";
import { IRewardManager } from "./IRewardManager.sol";
import { IMasset } from "./IMasset.sol";
import { MappingAddressToUint256 } from "../helpers/MappingAddressToUint256.sol";

/// @title A contract to manage rewards and penalties
/// @author Derek Matter
contract RewardManager is IRewardManager, Ownable {

    using SafeMath for uint256;
    uint256 constant ONE = 1000000000000000000;
    uint256 constant MIN_REWARD = ONE / 1000000;

    /** State **/

    IMasset private masset;
    uint256 private factor = 0;
    MappingAddressToUint256 private targetWeights = new MappingAddressToUint256();
    uint256 globalMaxPenaltyPerc = 0;
    uint256 globalMaxRewardPerc = 0;

    /** Events **/

    event onFactorChanged(address indexed sender, uint256 newFactor);
    event onTargetWeightChanged(address indexed sender, address indexed token, uint256 newTargetWeight);
    event onGlobalMaxPenaltyChanged(address indexed sender, uint256 newMax);
    event onGlobalMaxRewardChanged(address indexed sender, uint256 newMax);

    /** Modifiers **/

    /** External methods **/

    /// @notice Constructor
    constructor(address _massetAddress) public {
        require(Address.isContract(_massetAddress), "_massetAddress not a contract");
        masset = IMasset(_massetAddress);
    }

    /** Getters **/

    function getVersion() external pure returns (string memory) {
        return "3.0";
    }

    /// @notice Get the factor
    /// @return factor the factor
    function getFactor() external view returns (uint256) {
        return factor;
    }

    /// @notice Get the list of tokens
    /// @return tokens the tokens
    function getTokens() external view returns (address[] memory) {
        return targetWeights.getKeys();
    }

    /// @notice Get the target weight for a token
    /// @return targetWeight the target weight
    function getTargetWeight(address _tokenAddress) external view returns (uint256) {
        return targetWeights.get(_tokenAddress);
    }

    /// @notice Get the target weights for all tokens
    /// @return targetWeights the target weights
    function getTargetWeights() external view returns (uint256[] memory) {
        return targetWeights.getValues();
    }

    /// @notice Get the masset contract
    /// @return massetAddress the masset address
    function getMassetAddress() external view returns (address) {
        return address(masset);
    }

    /// @notice Get the global max penalty in percentage
    /// @return the maximum
    function getGlobalMaxPenaltyPerc() external view returns (uint256) {
        return globalMaxPenaltyPerc;
    }

    /// @notice Get the global max reward in percentage
    /// @return the maximum
    function getGlobalMaxRewardPerc() external view returns (uint256) {
        return globalMaxRewardPerc;
    }

    /** Setters **/

    /// @notice Set the factor
    /// @param _factor the factor
    function setFactor(uint256 _factor) external onlyOwner {
        factor = _factor;
        emit onFactorChanged(msg.sender, _factor);
    }

    /// @notice Set the global max penalty in percentage
    /// @param _max the maximum
    function setGlobalMaxPenaltyPerc(uint256 _max) external onlyOwner {
        require(_max <= 100 * ONE, "_max must be <= 100");
        globalMaxPenaltyPerc = _max;
        emit onGlobalMaxPenaltyChanged(msg.sender, _max);
    }

    /// @notice Set the global max reward in percentage
    /// @param _max the maximum
    function setGlobalMaxRewardPerc(uint256 _max) external onlyOwner {
        require(_max <= 100 * ONE, "_max must be <= 100");
        globalMaxRewardPerc = _max;
        emit onGlobalMaxRewardChanged(msg.sender, _max);
    }

    /// @notice Set target weights
    /// @param _tokenAddresses the token addresses
    /// @param _targetWeights the target weights
    function setTargetWeights(
        address[] calldata _tokenAddresses, 
        uint256[] calldata _targetWeights) external onlyOwner {

        require(_tokenAddresses.length == _targetWeights.length, "arrays not same length");
        targetWeights = new MappingAddressToUint256();
        uint256 total = 0;
        for(uint i=0; i<_tokenAddresses.length; i++) {
            require(Address.isContract(_tokenAddresses[i]), "token address not a contract");
            total = total.add(_targetWeights[i]);
            targetWeights.set(_tokenAddresses[i], _targetWeights[i]);
            emit onTargetWeightChanged(msg.sender, _tokenAddresses[i], _targetWeights[i]);
        }
        require(total == ONE, "total not one");
    }

    /// @notice Send funds from this contract. Only Owner can call.
    /// @param _tokenAddress the token address
    /// @param _recipient the recipient of thw funds
    /// @param _amount the amount to send
    function sendFunds(address _tokenAddress, address _recipient, uint256 _amount) external onlyOwner {
        require(_tokenAddress != address(0x00), "invalid token address");
        require(_recipient != address(0x00), "invalid recipient");
        bool result = IERC20(_tokenAddress).transfer(_recipient, _amount);
        require(result, "transfer failed");
    }

    /**  Incentive methods **/

    function _addOrSub(uint256 _a, int256 _b) public pure returns(uint256) {
        return _b >= 0 ? _a.add(uint256(_b)) : _a.sub(uint256(0 - _b));
    }

    function getWeight(uint256 _balance, uint256 _total) public pure returns (uint256) {
        if(_total == 0) {
            return 0;
        }
        return ONE.mul(_balance).div(_total);
    }

    function _dsqr(uint256 _a, uint256 _b) public pure returns (uint256) {
        uint256 d = _a > _b ? _a - _b : _b - _a;
        return d.mul(d).div(ONE);
    }

    /// @notice Get the average distance squared
    /// @param _basset the token address
    /// @param _sum the amount to withdraw or deposit
    function getAverageDsqrs(
        address _basset,
        int256 _sum
        ) public view returns (uint256 dsqrBefore, uint256 dsqrAfter) {

        require(_sum != 0, "zero sum");

        IBasketManager basketManager = IBasketManager(masset.getBasketManager());
        uint256 totalBefore = basketManager.getTotalBalanceInMasset(address(masset));
        uint256 totalAfter = _addOrSub(totalBefore, _sum);
        address[] memory tokens = targetWeights.getKeys();

        for(uint i=0; i<tokens.length; i++) {
            address tokenAddress = tokens[i];
            uint256 balanceBefore = basketManager.getBalanceInMasset(address(masset), tokenAddress);
            uint256 targetWeight = targetWeights.get(tokenAddress);
            uint256 weightBefore = getWeight(balanceBefore, totalBefore);
            uint256 balanceAfter = tokenAddress == _basset ? _addOrSub(balanceBefore, _sum) : balanceBefore;
            uint256 weightAfter = getWeight(balanceAfter, totalAfter);
            dsqrBefore = dsqrBefore.add(_dsqr(weightBefore, targetWeight));
            dsqrAfter = dsqrAfter.add(_dsqr(weightAfter, targetWeight));
        }

        dsqrBefore = dsqrBefore / tokens.length;
        dsqrAfter = dsqrAfter / tokens.length;
    }

    /// @notice Get the average distance squared
    /// @param _basset the token address
    /// @param _sum the amount to withdraw or deposit
    function getAverageDsqrsForBridgeDeposit(
        address _basset,
        uint256 _sum
        ) public view returns (uint256 dsqrBefore, uint256 dsqrAfter) {

        require(_sum > 0, "invalid sum");

        IBasketManager basketManager = IBasketManager(masset.getBasketManager());
        uint256 totalAfter = basketManager.getTotalBalanceInMasset(address(masset));
        uint256 totalBefore = totalAfter.sub(_sum);
        address[] memory tokens = targetWeights.getKeys();

        for(uint i=0; i<tokens.length; i++) {
            address tokenAddress = tokens[i];
            uint256 balanceBefore = basketManager.getBalanceInMasset(address(masset), tokenAddress);
            uint256 balanceAfter = balanceBefore;
            if(tokenAddress == _basset) {
                balanceBefore = balanceBefore.sub(_sum);
            }
            uint256 targetWeight = targetWeights.get(tokenAddress);
            uint256 weightBefore = getWeight(balanceBefore, totalBefore);
            uint256 weightAfter = getWeight(balanceAfter, totalAfter);
            dsqrBefore = dsqrBefore.add(_dsqr(weightBefore, targetWeight));
            dsqrAfter = dsqrAfter.add(_dsqr(weightAfter, targetWeight));
        }

        dsqrBefore = dsqrBefore / tokens.length;
        dsqrAfter = dsqrAfter / tokens.length;
    }

    /// @notice No reward if the weight of the token after the deposit is over the target weight
    /// @param _bassetAddress the token addresses
    /// @param _sum the amount to deposit
    /// @param _bridgeMode if this is true, the logic will assume that the tokens have already been sent and will perform the calculation accordingly.
    function isDepositDeservesReward(
            address _bassetAddress,
            uint256 _sum,
            bool _bridgeMode
        ) public view returns (bool) {
        IBasketManager basketManager = IBasketManager(masset.getBasketManager());
        uint256 targetWeight = targetWeights.get(_bassetAddress);
        uint256 balance = basketManager.getBalanceInMasset(address(masset), _bassetAddress);
        uint256 totalBalance = basketManager.getTotalBalanceInMasset(address(masset));
        if(!_bridgeMode) {
            balance = balance.add(_sum);
            totalBalance = totalBalance.add(_sum);
        }
        uint256 weight = getWeight(balance, totalBalance);
        return weight <= targetWeight;
    }


    /// @notice Get the reward for a deposit
    /// @param _bassetAddress the token addresses
    /// @param _sum the amount to deposit
    /// @param _bridgeMode if this is true, the logic will assume that the tokens have already been sent and will perform the calculation accordingly.
    function getRewardForDeposit(
        address _bassetAddress,
        uint256 _sum,
        bool _bridgeMode
        ) public view returns (uint256) {

        require(_sum < 1000000000000 * ONE, "_sum is too big"); // prevent overflow when casting to signed

        // uninitialized! avoid division by zero
        require(targetWeights.getKeys().length > 0, "no target weights");

        if(!isDepositDeservesReward(_bassetAddress, _sum, _bridgeMode)) {
            return 0;
        }

        IERC20 massetToken = IERC20(masset.getToken());

        (uint256 dsqrBefore, uint256 dsqrAfter) = _bridgeMode ? 
            getAverageDsqrsForBridgeDeposit(_bassetAddress, _sum) :
            getAverageDsqrs(_bassetAddress, int256(_sum));

        // the asymptotic part
        uint256 vBefore = dsqrBefore.mul(ONE).div(ONE.sub(dsqrBefore));
        uint256 vAfter = dsqrAfter.mul(ONE).div(ONE.sub(dsqrAfter));

        uint256 reward = vAfter < vBefore ?
            factor.mul(vBefore.sub(vAfter)).div(ONE) :
            0;

        uint256 available = massetToken.balanceOf(address(this));
        reward = reward < available ? reward : available;

        uint256 globalMax = _sum.mul(globalMaxRewardPerc.div(100)).div(ONE);
        reward = reward < globalMax ? reward : globalMax;
        reward = reward >= MIN_REWARD ? reward : 0; 

        return reward;
    }

    /// @notice Get the penalty for a withdrawal
    /// @param _bassetAddress the token addresses
    /// @param _sum the amount to withdraw
    function getPenaltyForWithdrawal(
        address _bassetAddress,
        uint256 _sum
        ) external view returns (uint256) {

        require(_sum < 1000000000000 * ONE, "_sum is too big"); // prevent overflow when casting to signed

        // uninitialized! avoid division by zero
        require(targetWeights.getKeys().length > 0, "no target weights");

        (uint256 dsqrBefore, uint256 dsqrAfter) = getAverageDsqrs(_bassetAddress, 0 - int256(_sum));

        // the asymptotic part
        uint256 vBefore = dsqrBefore.mul(ONE).div(ONE.sub(dsqrBefore));
        uint256 vAfter = dsqrAfter.mul(ONE).div(ONE.sub(dsqrAfter));

        uint256 penalty = vAfter > vBefore ?
            factor.mul(vAfter.sub(vBefore)).div(ONE) :
            0;

        uint256 globalMax = _sum.mul(globalMaxPenaltyPerc.div(100)).div(ONE);
        penalty = penalty < globalMax ? penalty : globalMax;

        return penalty;
    }

    /// @notice Send tokens as reward. Only the masset can call this method.
    /// @param _bassetAddress the token address
    /// @param _sum the amount
    /// @param _bridgeMode if this is true, the logic will assume that the tokens have already been sent and will perform the calculation accordingly.
    function sendRewardForDeposit(
        address _bassetAddress, 
        uint256 _sum, 
        address _recipient,
        bool _bridgeMode
        ) external returns (uint256) {

        require(msg.sender == address(masset), "only masset may call");

        uint256 reward = this.getRewardForDeposit(_bassetAddress, _sum, _bridgeMode);
        if(reward >= MIN_REWARD) {
            IERC20 massetToken = IERC20(masset.getToken());
            require(massetToken.transfer(_recipient, reward), "transfer failed");
        }
        
        return reward;
    }
}
