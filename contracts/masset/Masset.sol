// SPDX-License-Identifier: MIT
pragma solidity ^0.5.17;

import { IBasketManager } from "./IBasketManager.sol";
import { IRewardManager } from "./IRewardManager.sol";
import { SafeMath } from "../openzeppelin/contracts/math/SafeMath.sol";
import { IERC20 } from "../openzeppelin/contracts/token/ERC20/IERC20.sol";
import { IERC777Recipient } from "../openzeppelin/contracts/token/ERC777/IERC777Recipient.sol";
import { IERC1820Registry } from "../openzeppelin/contracts/introspection/IERC1820Registry.sol";
import { IBridge } from "./IBridge.sol";
import { InitializableOwnable } from "../helpers/InitializableOwnable.sol";
import "./Token.sol";
import "./IMasset.sol";
import { InitializableReentrancyGuard } from "../helpers/InitializableReentrancyGuard.sol";
import "./PauseManager.sol";
import { Address } from "../openzeppelin/contracts/utils/Address.sol";
import { IBonusManager } from "./IBonusManager.sol";

contract Masset is IMasset, IERC777Recipient, InitializableOwnable, InitializableReentrancyGuard {

    using SafeMath for uint256;

    // Events

    event Minted(
        address indexed minter,
        address indexed recipient,
        uint256 massetQuantity,
        address bAsset,
        uint256 bassetQuantity);

    event Redeemed(
        address indexed redeemer,
        address indexed recipient,
        uint256 massetQuantity,
        address bAsset,
        uint256 bassetQuantity);

    event onTokensReceivedCalled(
        address operator,
        address from,
        address to,
        uint amount,
        bytes userData,
        bytes operatorData
    );

    event onTokensMintedCalled(
        address indexed sender,
        uint256 orderAmount,
        address tokenAddress,
        bytes userData
    );

    event onSetBasketManager(address indexed sender, address indexed oldBasketManager, address indexed newBaskManager);
    event onSetToken(address indexed sender, address indexed oldToken, address indexed newToken);
    event onSetTokenOwner(address indexed sender, address indexed oldTokenOwner, address indexed newTokenOwner);
    event onSetBonusManager(address indexed sender, address indexed oldBonusManager, address indexed newBonusManager);

    event onSetPauseManager(address indexed sender, address indexed oldPauseManager, address indexed newPauseManager);
    event onSetRewardManager(address indexed sender, address indexed oldRewardManager, address indexed newRewardManager);
    event onSetAdminMultisig(address indexed sender, address indexed oldAdminMultisig, address indexed newAdminMultisig);

    event onRewardPaid(address indexed basset, uint256 amount, address indexed user, uint256 reward);
    event onPenaltyPaid(address indexed basset, uint256 amount, address indexed user, uint256 penalty);

    // state

    string private version;
    IBasketManager private basketManager;
    Token private token;
    PauseManager private pauseManager;
    IRewardManager private rewardManager;
    IBonusManager private bonusManager;
    address adminMultisig;

    // internal

    function registerAsERC777Recipient() internal {
        IERC1820Registry ERC1820 = IERC1820Registry(0x1820a4B7618BdE71Dce8cdc73aAB6C95905faD24);
        ERC1820.setInterfaceImplementer(address(this), keccak256("ERC777TokensRecipient"), address(this));
    }

    modifier tokenIsNotPaused(address _bAsset) {
        if(address(pauseManager) != address(0)) {
            require(!pauseManager.isPaused(_bAsset), "basset paused");
        }
        _;
    }

    // public

    function initialize(
        address _basketManagerAddress,
        address _tokenAddress,
        bool _registerAsERC777RecipientFlag) public {

        require(address(basketManager) == address(0) && address(token) == address(0), "already initialized");
        require(_basketManagerAddress != address(0), "invalid basket manager");
        require(_tokenAddress != address(0), "invalid token");

        InitializableOwnable._initialize();
        InitializableReentrancyGuard._initialize();

        basketManager = IBasketManager(_basketManagerAddress);
        token = Token(_tokenAddress);
        if(_registerAsERC777RecipientFlag) {
            registerAsERC777Recipient();
        }

        version = "1.0";
    }

    function compareStrings(string memory stra, string memory strb) public pure returns (bool) {
        return keccak256(bytes(stra)) == keccak256(bytes(strb));
    }

    /**
    * Internal incentive functions
    **/

    function payReward(
        address _bassetAddress, 
        uint256 _sum, 
        address _recipient,
        bool _bridgeMode) internal returns (uint256) {

        if(address(rewardManager) == address(0)) {
            return 0;
        }

        uint256 reward = rewardManager.sendRewardForDeposit(_bassetAddress, _sum, _recipient, _bridgeMode);

        emit onRewardPaid(_bassetAddress, _sum, _recipient, reward);

        return reward;
    }

    function mintPenalty(
        address _bassetAddress, 
        uint256 _sum, 
        address _recipient) internal returns (uint256) {

        if(address(rewardManager) == address(0)) {
            return 0;
        }

        uint256 penalty = rewardManager.getPenaltyForWithdrawal(_bassetAddress, _sum);
        token.mint(address(rewardManager), penalty);

        emit onPenaltyPaid(_bassetAddress, _sum, _recipient, penalty);

        return penalty;
    }

    /***************************************
                MINTING (PUBLIC)
    ****************************************/

    /**
     * @dev Mint masset, at a 1:1 ratio with the bAsset. This contract
     *      must have approval to spend the senders bAsset
     * @param _bAsset         Address of the bAsset to deposit
     * @param _bAssetQuantity Quantity in bAsset units
     * @return massetMinted   Number of newly minted mAssets
     */
    function mint(
        address _bAsset,
        uint256 _bAssetQuantity)
    external
    nonReentrant
    returns (uint256 massetMinted) {        
        return _mintTo(_bAsset, _bAssetQuantity, msg.sender, 0);
    }

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
        uint256 _minimumReward)
    external
    nonReentrant
    returns (uint256 massetMinted) {        
        return _mintTo(_bAsset, _bAssetQuantity, msg.sender, _minimumReward);
    }

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
        address _recipient)
    external
    nonReentrant
    returns (uint256 massetMinted) {
        return _mintTo(_bAsset, _bAssetQuantity, _recipient, 0);
    }

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
        uint256 _minimumReward)
    external
    nonReentrant
    returns (uint256 massetMinted) {
        return _mintTo(_bAsset, _bAssetQuantity, _recipient, _minimumReward);
    }

    /***************************************
              MINTING (INTERNAL)
    ****************************************/

    function _mintTo(
        address _basset,
        uint256 _bassetQuantity,
        address _recipient,
        uint256 _minimumReward)
    internal
    tokenIsNotPaused(_basset)
    returns (uint256 massetMinted) {
        require(_recipient != address(0), "must be a valid recipient");
        require(_bassetQuantity > 0, "quantity must not be 0");

        require(basketManager.isValidBasset(_basset), "invalid basset");

        uint256 reward = payReward(_basset, _bassetQuantity, _recipient, false);
        require(reward >= _minimumReward, "reward under minimum");

        uint256 massetQuantity = _bassetQuantity;

        require(IERC20(_basset).transferFrom(msg.sender, address(this), _bassetQuantity), "transfer failed");

        token.mint(_recipient, massetQuantity);
        emit Minted(msg.sender, _recipient, massetQuantity, _basset, _bassetQuantity);

        if(address(bonusManager) != address(0)) {
            bonusManager.sendBonus(_basset, _recipient, massetQuantity);
        }

        return massetQuantity;
    }

    /***************************************
              REDEMPTION (PUBLIC)
    ****************************************/

    /**
     * @dev Credits the sender with a certain quantity of selected bAsset, in exchange for burning the
     *      relative mAsset quantity from the sender. Sender also incurs a small mAsset fee, if any.
     * @param _bAsset           Address of the bAsset to redeem
     * @param _massetQuantity   Units of the masset to redeem
     * @return massetMinted     Relative number of mAsset units burned to pay for the bAssets
     */
    function redeem(
        address _bAsset,
        uint256 _massetQuantity
    ) external nonReentrant returns (uint256 massetRedeemed) {
        return _redeemTo(_bAsset, _massetQuantity, msg.sender, false, _massetQuantity);
    }

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
        uint256 _maximumPenalty
    ) external nonReentrant returns (uint256 massetRedeemed) {
        return _redeemTo(_bAsset, _massetQuantity, msg.sender, false, _maximumPenalty);
    }

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
        address _recipient
    ) external nonReentrant returns (uint256 massetRedeemed) {
        return _redeemTo(_bAsset, _massetQuantity, _recipient, false, _massetQuantity);
    }

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
        uint256 _maximumPenalty
    ) external nonReentrant returns (uint256 massetRedeemed) {
        return _redeemTo(_bAsset, _massetQuantity, _recipient, false, _maximumPenalty);
    }

    /***************************************
              REDEMPTION (INTERNAL)
    ****************************************/

    function _redeemTo(
        address _basset,
        uint256 _massetQuantity,
        address _recipient,
        bool _bridgeFlag,
        uint256 _maximumPenalty
    ) internal returns (uint256 massetRedeemed) {
        require(_recipient != address(0), "must be a valid recipient");
        require(_massetQuantity > 0, "masset quantity must be greater than 0");
        require(basketManager.isValidBasset(_basset), "invalid basset");

        uint256 bassetQuantity = _massetQuantity;

        token.burn(msg.sender, _massetQuantity);

        // This has to happen here, before trnsfering the basset! 
        // Otherwise the calculation is all wrong
        
        uint256 penalty = mintPenalty(_basset, bassetQuantity, _recipient);
        require(penalty <= _maximumPenalty, "penalty exceeds maximum");
        uint256 penaltyInBasset = penalty;
        bassetQuantity = bassetQuantity.sub(penaltyInBasset);

        if(_bridgeFlag) {
            address bridgeAddress = basketManager.getBridge(_basset);
            require(bridgeAddress != address(0), "invalid bridge");
            IERC20(_basset).approve(bridgeAddress, bassetQuantity);
            require(
                IBridge(bridgeAddress).receiveTokensAt(_basset, bassetQuantity, _recipient, bytes("")),
                "call to bridge failed");
        } else {
            require(IERC20(_basset).transfer(_recipient, bassetQuantity), "transfer failed");
        }

        emit Redeemed(msg.sender, _recipient, _massetQuantity, _basset, bassetQuantity);

        return _massetQuantity;
    }

    // For the BRIDGE

    /**
     * @dev Credits a recipient with a certain quantity of selected bAsset, in exchange for burning the
     *      relative Masset quantity from the sender. Sender also incurs a small fee, if any.
     *      This function is designed to also call the bridge in order to have the basset tokens sent to
     *      another blockchain.
     * @param _basset           Address of the bAsset to redeem
     * @param _massetQuantity   Units of the masset to redeem
     * @param _recipient        Address to credit with withdrawn bAssets
     * @return massetMinted     Relative number of mAsset units burned to pay for the bAssets
     */
    function redeemToBridge(
        address _basset,
        uint256 _massetQuantity,
        address _recipient
    ) external nonReentrant returns (uint256 massetRedeemed) {
        return _redeemTo(_basset, _massetQuantity, _recipient, true, _massetQuantity);
    }

    function redeemToBridgeWithMaximumPenalty(
        address _basset,
        uint256 _massetQuantity,
        address _recipient,
        uint256 _maximumPenalty
    ) external nonReentrant returns (uint256 massetRedeemed) {
        return _redeemTo(_basset, _massetQuantity, _recipient, true, _maximumPenalty);
    }

    function _decodeAddress(bytes memory data) private pure returns (address) {
        address addr = abi.decode(data, (address));
        require(addr != address(0), "Converter: Error decoding extraData");
        return addr;
    }

    function _encodeUserData(address _address, uint256 _minimum) private pure returns (bytes memory) {
        require(_address != address(0), "Converter: Error encoding extraData");
        return abi.encode(_address, _minimum);
    }

    function tokensReceived(
        address _operator,
        address _from,
        address _to,
        uint _amount,
        bytes calldata _userData,
        bytes calldata _operatorData
    ) external {
        emit onTokensReceivedCalled(
            _operator,
            _from,
            _to,
            _amount,
            _userData,
            _operatorData
        );
    }

    /**
     * @dev This is called by the bridge to let us know the user has sent tokens through it and
     *      into the masset.
     * @param _orderAmount      Units of the masset to redeem
     * @param _tokenAddress     Address of the bAsset to redeem
     * @param _userData         Address of the final recipient as ABI encoded bytes, and 
                                optionally a minimum reward for slippage protection
     */
    function onTokensMinted(
        uint256 _orderAmount,
        address _tokenAddress,
        bytes calldata _userData
    ) external tokenIsNotPaused(_tokenAddress) nonReentrant {
        emit onTokensMintedCalled(msg.sender, _orderAmount, _tokenAddress, _userData);

        require(_orderAmount > 0, "amount must be > 0");

        address bridgeAddress = basketManager.getBridge(_tokenAddress);
        require(msg.sender == bridgeAddress, "only bridge may call");

        require(basketManager.isValidBasset(_tokenAddress), "invalid basset");

        address recipient = _decodeAddress(_userData);
        payReward(_tokenAddress, _orderAmount, recipient, true);

        uint256 massetQuantity = _orderAmount;
        token.mint(recipient, massetQuantity);
        emit Minted(msg.sender, recipient, massetQuantity, _tokenAddress, _orderAmount);

        if(address(bonusManager) != address(0)) {
            bonusManager.sendBonus(address(token), recipient, massetQuantity);
        }
    }

    // Getters

    function getVersion() external view returns (string memory) {
        return version;
    }

    function getToken() external view returns (address) {
        return address(token);
    }

    function getBasketManager() external view returns (address) {
        return address(basketManager);
    }

    function getPauseManager() external view returns (address) {
        return address(pauseManager);
    }

    function getRewardManager() external view returns (address) {
        return address(rewardManager);
    }

    function getBonusManager() external view returns (address) {
        return address(bonusManager);
    }

    function getAdminMultisig() external view returns (address) {
        return adminMultisig;
    }

    // Admin functions

    function setBasketManager(address _basketManagerAddress) public onlyOwner {
        require(_basketManagerAddress != address(basketManager), "same address");
        require(Address.isContract(_basketManagerAddress), "not a contract");

        emit onSetBasketManager(msg.sender, address(basketManager), _basketManagerAddress);
        basketManager = IBasketManager(_basketManagerAddress);
    }

    function setToken(address _tokenAddress) public onlyOwner {
        require(_tokenAddress != address(token), "same address");
        require(Address.isContract(_tokenAddress), "not a contract");

        emit onSetToken(msg.sender, address(token), _tokenAddress);
        token = Token(_tokenAddress);
    }

    function setTokenOwner(address _newOwner) public onlyOwner {
        require(_newOwner != address(0), "address invalid");
        require(_newOwner != token.owner(), "same address");

        emit onSetTokenOwner(msg.sender, token.owner(), _newOwner);
        token.transferOwnership(_newOwner);
    }

    function setPauseManager(address _newPauseManager) public onlyOwner {
        require(_newPauseManager != address(pauseManager), "same address");
        require(Address.isContract(_newPauseManager), "not a contract");

        emit onSetPauseManager(msg.sender, address(pauseManager), _newPauseManager);
        pauseManager = PauseManager(_newPauseManager);
    }

    function setRewardManager(address _newRewardManager) public onlyOwner {
        
        require(_newRewardManager != address(rewardManager), "same address");
        require(Address.isContract(_newRewardManager), "not a contract");
        IRewardManager newRewardManager = IRewardManager(_newRewardManager);

        // can't accept a RM that doesn't have me as the masset
        require(newRewardManager.getMassetAddress() == address(this), "invalid masset in RM");

        // let's do the twist
        IRewardManager oldRewardManager = rewardManager;
        rewardManager = newRewardManager;

        // version 3.0 didn't have this method
        if(address(oldRewardManager) != address(0) && !compareStrings(oldRewardManager.getVersion(), "3.0")) {
            // send all the funds from the old RM to the new one
            oldRewardManager.sendFundsToRewardManager();
        }
        emit onSetRewardManager(msg.sender, address(oldRewardManager), _newRewardManager);
    }

    function setBonusManager(address _newBonusManagerAddress) public onlyOwner {
        require(Address.isContract(_newBonusManagerAddress), "not a contract");
        emit onSetBonusManager(msg.sender, address(bonusManager), _newBonusManagerAddress);
        bonusManager = IBonusManager(_newBonusManagerAddress);
    }

    function removeBonusManager() public onlyOwner {
        emit onSetBonusManager(msg.sender, address(bonusManager), address(0));
        bonusManager = IBonusManager(address(0));
    }

    function setAdminMultisig(address _newAdminMultisig) public onlyOwner {
        require(Address.isContract(_newAdminMultisig), "not a contract");
        emit onSetAdminMultisig(msg.sender, adminMultisig, _newAdminMultisig);
        adminMultisig = _newAdminMultisig;
    }

    // admin function to extract tokens to pre-defined multisig address

    /**
     * @dev This can be called by a pre-defined mutisig address in order to 
     *      convert some funds in one tx
     * @param _tokenA     Address of the first bAsset
     * @param _tokenB     Address of the second bAsset
     * @param _amount     Amount to extract
     */
    function convertTokens(address _tokenA, address _tokenB, uint256 _amount) external {
        require(msg.sender == adminMultisig, "not allowed");

        require(_tokenA != _tokenB, "same token");

        require(Address.isContract(_tokenA), "_tokenA not a contract");
        require(basketManager.isValidBasset(_tokenA), "invalid basset _tokenA");
        
        require(Address.isContract(_tokenB), "_tokenB not a contract");
        require(basketManager.isValidBasset(_tokenB), "invalid basset _tokenB");

        bool result = IERC20(_tokenA).transferFrom(msg.sender, address(this), _amount);
        require(result, "transfer 1 failed");
        result = IERC20(_tokenB).transfer(msg.sender, _amount);
        require(result, "transfer 2 failed");
    }      

    // Temporary migration code

    /**
     * @dev This should only be called once, immediately after the upgrade from 5.x to 6.0
     * @param _newBasketManager       New basket manager
     * @param _newRewardManager       New reward manager
     */
    function migrateToV6(address _newBasketManager, address _newRewardManager) public onlyOwner {
        
        // make sure we have the correct version here
        require(compareStrings(version, "5.0") ||
            compareStrings(version, "5.1") ||
            compareStrings(version, "5.2"), "wrong version");

        version = "6.0";
        bonusManager = IBonusManager(0);

        require(Address.isContract(_newBasketManager), "_newBasketManager not a contract");
        IBasketManager newBasketManager = IBasketManager(_newBasketManager);
        require(compareStrings(newBasketManager.getVersion(), "5.0"), "wrong version basket manager");
        setBasketManager(_newBasketManager);

        require(Address.isContract(_newRewardManager), "_newRewardManager not a contract");
        IRewardManager newRewardManager = IRewardManager(_newRewardManager);
        require(compareStrings(newRewardManager.getVersion(), "3.0"), "wrong version reward manager");
        setRewardManager(_newRewardManager);
    }
}
