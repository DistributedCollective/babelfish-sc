pragma solidity 0.5.17;

contract MockRewardManager {

    /**  Incentive methods **/

    uint256 public getRewardForDeposit_return;

    function setGetRewardForDeposit_return(uint256 v) public {
        getRewardForDeposit_return = v;
    }

    function getRewardForDeposit(
        address _bassetAddress,
        uint256 _sum,
        bool _bridgeMode
        ) external view returns (uint256) {
        return getRewardForDeposit_return;
    }

    uint256 public getPenaltyForWithdrawal_return;

    function setGetPenaltyForWithdrawal_return(uint256 v) public {
        getPenaltyForWithdrawal_return = v;
    }

    function getPenaltyForWithdrawal(
        address _bassetAddress,
        uint256 _sum
        ) external view returns (uint256) {
        return getPenaltyForWithdrawal_return;
    }

    bool public sendRewardForDepositCalled;
    address public sendRewardForDepositCalled_bassetAddress;
    uint256 public sendRewardForDepositCalled_sum;
    address public sendRewardForDepositCalled_recipient;
    bool public sendRewardForDepositCalled_bridgeMode;
    uint256 public sendRewardForDepositCalled_return;

    function setSendRewardForDepositCalled_return(uint256 v) public {
        sendRewardForDepositCalled_return = v;
    }

    function sendRewardForDeposit(
        address _bassetAddress, 
        uint256 _sum, 
        address _recipient, 
        bool _bridgeMode
        ) external returns (uint256) {
        sendRewardForDepositCalled = true;
        sendRewardForDepositCalled_bassetAddress = _bassetAddress;
        sendRewardForDepositCalled_sum = _sum;
        sendRewardForDepositCalled_recipient = _recipient;
        sendRewardForDepositCalled_bridgeMode = _bridgeMode;
        return sendRewardForDepositCalled_return;
    }

}