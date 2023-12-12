// SPDX-License-Identifier: MIT
pragma solidity ^0.5.17;

import { BasketManager } from "./BasketManager.sol";
import { RewardManager } from "./RewardManager.sol";
import { SafeMath } from "../openzeppelin/contracts/math/SafeMath.sol";
import { IERC20 } from "../openzeppelin/contracts/token/ERC20/IERC20.sol";
import { IERC777Recipient } from "../openzeppelin/contracts/token/ERC777/IERC777Recipient.sol";
import { IERC1820Registry } from "../openzeppelin/contracts/introspection/IERC1820Registry.sol";
import { IBridge } from "./IBridge.sol";
import { InitializableOwnable } from "../helpers/InitializableOwnable.sol";
import "./Token.sol";
import { InitializableReentrancyGuard } from "../helpers/InitializableReentrancyGuard.sol";
import "./PauseManager.sol";
import { Address } from "../openzeppelin/contracts/utils/Address.sol";

interface IMasset {

    /**
     * @dev Mint masset, at a 1:1 ratio with the bAsset. This contract
     *      must have approval to spend the senders bAsset
     * @param _bAsset         Address of the bAsset to deposit
     * @param _bAssetQuantity Quantity in bAsset units
     * @return massetMinted   Number of newly minted mAssets
     */
    function mint(
        address _bAsset,
        uint256 _bAssetQuantity) external returns (uint256 massetMinted);

    /**
     * @dev Mint masset, at a 1:1 ratio with the bAsset. This contract
     *      must have approval to spend the senders bAsset.
     *      Also provide a minimum reward expected to prevent slippage.
     * @param _bAsset         Address of the bAsset to deposit
     * @param _bAssetQuantity Quantity in bAsset units
     * @param _minimumReward minimum reward expected, or revert
     * @return massetMinted   Number of newly minted mAssets
     */
    function mintWithMinimumReward(
        address _bAsset,
        uint256 _bAssetQuantity,
        uint256 _minimumReward) external returns (uint256 massetMinted);

    /**
     * @dev Mint masset, at a 1:1 ratio with the bAsset. This contract
     *      must have approval to spend the senders bAsset
     * @param _bAsset         Address of the bAsset to deposit
     * @param _bAssetQuantity Quantity in bAsset units
     * @param _recipient receipient of the newly minted mAsset tokens
     * @return massetMinted   Number of newly minted mAssets
     */
    function mintTo(
        address _bAsset,
        uint256 _bAssetQuantity,
        address _recipient) external returns (uint256 massetMinted);

    /**
     * @dev Mint masset, at a 1:1 ratio with the bAsset. This contract
     *      must have approval to spend the senders bAsset.
     *      Also provide a minimum reward expected to prevent slippage.
     * @param _bAsset         Address of the bAsset to deposit
     * @param _bAssetQuantity Quantity in bAsset units
     * @param _recipient receipient of the newly minted mAsset tokens
     * @param _minimumReward minimum reward expected, or revert
     * @return massetMinted   Number of newly minted mAssets
     */
    function mintToWithMinimumReward(
        address _bAsset,
        uint256 _bAssetQuantity,
        address _recipient,
        uint256 _minimumReward) external returns (uint256 massetMinted);

    /**
     * @dev Credits the sender with a certain quantity of selected bAsset, in exchange for burning the
     *      relative mAsset quantity from the sender. Sender also incurs a small mAsset fee, if any.
     * @param _bAsset           Address of the bAsset to redeem
     * @param _massetQuantity   Units of the masset to redeem
     * @return massetMinted     Relative number of mAsset units burned to pay for the bAssets
     */
    function redeem(
        address _bAsset,
        uint256 _massetQuantity) external returns (uint256 massetRedeemed);

    /**
     * @dev Credits the sender with a certain quantity of selected bAsset, in exchange for burning the
     *      relative mAsset quantity from the sender. Sender also incurs a small mAsset fee, if any.
     *      Specify maximum penalty to prevent slippage.
     * @param _bAsset           Address of the bAsset to redeem
     * @param _massetQuantity   Units of the masset to redeem
     * @param _maximumPenalty   Maximum penalty willing to pay, or revert
     * @return massetMinted     Relative number of mAsset units burned to pay for the bAssets
     */
    function redeemWithMaximumPenalty(
        address _bAsset,
        uint256 _massetQuantity,
        uint256 _maximumPenalty) external returns (uint256 massetRedeemed);

    /**
     * @dev Credits a recipient with a certain quantity of selected bAsset, in exchange for burning the
     *      relative Masset quantity from the sender. Sender also incurs a small fee, if any.
     * @param _bAsset           Address of the bAsset to redeem
     * @param _massetQuantity   Units of the masset to redeem
     * @param _recipient        Address to credit with withdrawn bAssets
     * @return massetMinted     Relative number of mAsset units burned to pay for the bAssets
     */
    function redeemTo(
        address _bAsset,
        uint256 _massetQuantity,
        address _recipient) external returns (uint256 massetRedeemed);

    /**
     * @dev Credits the sender with a certain quantity of selected bAsset, in exchange for burning the
     *      relative mAsset quantity from the sender. Sender also incurs a small mAsset fee, if any.
     *      Specify maximum penalty to prevent slippage.
     * @param _bAsset           Address of the bAsset to redeem
     * @param _massetQuantity   Units of the masset to redeem
     * @param _recipient        Address to credit with withdrawn bAssets
     * @param _maximumPenalty   Maximum penalty willing to pay, or revert
     * @return massetMinted     Relative number of mAsset units burned to pay for the bAssets
     */
    function redeemToWithMaximumPenalty(
        address _bAsset,
        uint256 _massetQuantity,
        address _recipient,
        uint256 _maximumPenalty) external returns (uint256 massetRedeemed);

    // Getters

    function getVersion() external view returns (string memory);

    function getToken() external view returns (address);

    function getBasketManager() external view returns (address);

    function getPauseManager() external view returns (address);

    function getRewardManager() external view returns (address);

}
