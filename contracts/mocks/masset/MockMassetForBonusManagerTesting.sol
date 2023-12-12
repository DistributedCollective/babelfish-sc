// SPDX-License-Identifier: MIT
pragma solidity ^0.5.17;

import "../../masset/BasketManager.sol";
import "../../masset/IRewardManager.sol";
import "../../masset/Token.sol";
import "../../openzeppelin/contracts/utils/Address.sol";
import "../../masset/IBonusManager.sol";

contract MockMassetForBonusManagerTesting {

    BasketManager private basketManager;
    Token private token;
    IRewardManager private rewardManager;
    IBonusManager private bonusManager;

    function getToken() external view returns (address) {
        return address(token);
    }

    function getBasketManager() external view returns (address) {
        return address(basketManager);
    }

    function getRewardManager() external view returns (address) {
        return address(rewardManager);
    }

    function getBonusManager() external view returns (address) {
        return address(bonusManager);
    }

    function setBasketManager(address _basketManagerAddress) public {
        basketManager = BasketManager(_basketManagerAddress);
    }

    function setToken(address _tokenAddress) public {
        token = Token(_tokenAddress);
    }

    function setRewardManager(address _newRewardManager) public {
        rewardManager = IRewardManager(_newRewardManager);
    }

    function setBonusManager(address _newBonusManagerAddress) public {
        bonusManager = IBonusManager(_newBonusManagerAddress);
    }

    function sendBonus(address _token, address _recipient, uint256 _amount) public returns (uint256) {
        return bonusManager.sendBonus(_token, _recipient, _amount);
    }
}
