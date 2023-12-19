// SPDX-License-Identifier: MIT
pragma solidity ^0.5.17;

interface IRewardManager {

    /** Getters **/

    /// @notice Get the version
    /// @return version
    function getVersion() external pure returns (string memory);

    /// @notice Get the factor
    /// @return factor the factor
    function getFactor() external view returns (uint256);

    /// @notice Get the list of tokens
    /// @return tokens the tokens
    function getTokens() external view returns (address[] memory);

    /// @notice Get the target weight for a token
    /// @return targetWeight the target weight
    function getTargetWeight(address _tokenAddress) external view returns (uint256);

    /// @notice Get the target weights for all tokens
    /// @return targetWeights the target weights
    function getTargetWeights() external view returns (uint256[] memory);

    /// @notice Get the masset contract
    /// @return massetAddress the masset address
    function getMassetAddress() external view returns (address);

    /// @notice Get the global max penalty in percentage
    /// @return the maximum
    function getGlobalMaxPenaltyPerc() external view returns (uint256);
    /// @notice Get the global max reward in percentage
    /// @return the maximum
    function getGlobalMaxRewardPerc() external view returns (uint256);

    /** Setters **/

    /// @notice Set the factor
    /// @param _factor the factor
    function setFactor(uint256 _factor) external;

    /// @notice Set the global max penalty in percentage
    /// @param _max the maximum
    function setGlobalMaxPenaltyPerc(uint256 _max) external;

    /// @notice Set the global max reward in percentage
    /// @param _max the maximum
    function setGlobalMaxRewardPerc(uint256 _max) external;

    /// @notice Set a target weights
    /// @param _tokenAddresses the token addresses
    /// @param _targetWeights the target weights
    function setTargetWeights(
        address[] calldata _tokenAddresses, 
        uint256[] calldata _targetWeights) external;

    /** admin methods **/

    /// @notice Send all XUSD funds from this contract to the current reward manager
    /// !!! anybody can call this method !!!
    function sendFundsToCurrent() external;

    /**  Incentive methods **/

    /// @notice Get the reward amount
    /// @param _bassetAddress the token address
    /// @param _sum the amount
    /// @param _bridgeMode if this is true, the logic will assume that the tokens have already been sent and will perform the calculation accordingly.    
    function getRewardForDeposit(
        address _bassetAddress,
        uint256 _sum,
        bool _bridgeMode
        ) external view returns (uint256);

    /// @notice Get the penalty amount
    /// @param _bassetAddress the token address
    /// @param _sum the amount
    function getPenaltyForWithdrawal(
        address _bassetAddress,
        uint256 _sum
        ) external view returns (uint256);

    /// @notice Send tokens as reward
    /// @param _bassetAddress the token address
    /// @param _sum the amount
    /// @param _bridgeMode if this is true, the logic will assume that the tokens have already been sent and will perform the calculation accordingly.
    function sendRewardForDeposit(
        address _bassetAddress, 
        uint256 _sum, 
        address _recipient,
        bool _bridgeMode
        ) external returns (uint256);
}
