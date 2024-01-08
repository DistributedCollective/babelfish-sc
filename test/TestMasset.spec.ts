/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable @typescript-eslint/no-use-before-define */
import envSetup from "@utils/env_setup";
import { expectRevert, expectEvent } from "@openzeppelin/test-helpers";
import { ZERO, ZERO_ADDRESS } from "@utils/constants";
import { StandardAccounts } from "@utils/standardAccounts";
import { BasketManagerInstance, MassetInstance, RewardManagerContract, RewardManagerInstance } from "types/generated";
import { MockRewardManagerContract, MockRewardManagerInstance } from "types/generated/MockRewardManager";
import BN from "bn.js";

const { expect } = envSetup.configure();

const BasketManager = artifacts.require("BasketManager");
const MockRewardManager: MockRewardManagerContract = artifacts.require("MockRewardManager");
const RewardManager: RewardManagerContract = artifacts.require("RewardManager");
const Masset = artifacts.require("Masset");
const Token = artifacts.require("Token");
const MockERC20 = artifacts.require("MockERC20");

let standardAccounts;

contract("Masset", async (accounts) => {
   standardAccounts = new StandardAccounts(accounts);

    before("before all", async () => {});

    describe("initialize", async () => {
        let masset;
        let basketManagerObj; 
        let token;
        beforeEach(async () => {
            masset = await Masset.new();
            basketManagerObj = await createBasketManager([18, 18], [0, 0], false);
            token = await createToken(masset);
        });
        context("should succeed", async () => {
            it("when given a valid basket manager", async () => {
                await masset.initialize(basketManagerObj.basketManager.address, token.address, false);
            });
        });
        context("should fail", async () => {
            it("when basket manager missing", async () => {
                await expectRevert.unspecified(
                    masset.initialize(ZERO_ADDRESS, token.address, false));
            });
            it("when token missing", async () => {
                await expectRevert.unspecified(
                    masset.initialize(basketManagerObj.basketManager.address, ZERO_ADDRESS, false));
            });
            it("when already initialized", async () => {
                await masset.initialize(basketManagerObj.basketManager.address, token.address, false);
                await expectRevert.unspecified(
                    masset.initialize(basketManagerObj.basketManager.address, token.address, false));
            });
        });
    });

    describe("mint", async () => {
        let masset;
        let basketManagerObj; let token;
        let mockTokenDummy;
        beforeEach(async () => {
            masset = await Masset.new();
            token = await createToken(masset);
            basketManagerObj = await createBasketManager([18, 18], [1000, 1000], false);
            await masset.initialize(basketManagerObj.basketManager.address, token.address, false);
            mockTokenDummy = await MockERC20.new("", "", 12, standardAccounts.dummy1, 1);
        });
        context("should succeed", () => {
            it("if all params are valid", async () => {
                const sum = '1000000000000000000';
                await basketManagerObj.mockToken1.approve(masset.address, sum, {
                    from: standardAccounts.dummy1,
                });
                const tx = await masset.mint(basketManagerObj.mockToken1.address, sum, {
                    from: standardAccounts.dummy1,
                });
                await expectEvent(tx.receipt, 'Minted', {
                    minter: standardAccounts.dummy1,
                    recipient: standardAccounts.dummy1,
                    massetQuantity: sum,
                    bAsset: basketManagerObj.mockToken1.address,
                    bassetQuantity: sum
                });
                const balance = await token.balanceOf(standardAccounts.dummy1);
                expect(balance.toString()).to.equal(`${sum}`);
            });
        });
        context("should fail", () => {
            it("if basset is invalid", async () => {
                await expectRevert.unspecified(
                    masset.mint(ZERO_ADDRESS, 10));
            });
            it("if basset is not in the basket", async () => {
                await expectRevert.unspecified(
                    masset.mint(mockTokenDummy.address, 10));
            });
            it("if amount is greater than the balance", async () => {
                await expectRevert.unspecified(
                    masset.mint(basketManagerObj.mockToken1.address, 100000));
            });
        });
    });
    describe("mintTo", async () => {
        let masset;
        let basketManagerObj; let token;
        beforeEach(async () => {
            masset = await Masset.new();
            basketManagerObj = await createBasketManager([18, 18], [1, 1], false);
            token = await createToken(masset);
            await masset.initialize(basketManagerObj.basketManager.address, token.address, false);
        });
        context("should succeed", () => {
            it("if all params are valid", async () => {
                const sum = '100000000000000000';
                await basketManagerObj.mockToken1.approve(masset.address, sum, 
                    { from: standardAccounts.dummy1 }
                );
                const tx = await masset.mintTo(
                    basketManagerObj.mockToken1.address,
                    sum,
                    standardAccounts.dummy4,
                    { from: standardAccounts.dummy1 }
                );
                await expectEvent(tx.receipt, 'Minted', {
                    minter: standardAccounts.dummy1,
                    recipient: standardAccounts.dummy4,
                    massetQuantity: sum,
                    bAsset: basketManagerObj.mockToken1.address,
                    bassetQuantity: sum
                });
                const balance = await token.balanceOf(standardAccounts.dummy4);
                expect(balance.toString()).to.equal(`${sum}`);
            });
        });
    });

    describe("redeem", async () => {
        let masset;
        let basketManagerObj; let token;
        let mockTokenDummy;
        beforeEach(async () => {
            masset = await Masset.new();
            token = await createToken(masset);
            basketManagerObj = await createBasketManager([18, 18], [1, 1], false);
            await masset.initialize(basketManagerObj.basketManager.address, token. address, false);
            mockTokenDummy = await MockERC20.new("", "", 12, standardAccounts.dummy1, 1);
        });
        context("should succeed", () => {
            it("if all params are valid", async () => {
                const sum = '100000000000000000';
                await basketManagerObj.mockToken1.approve(masset.address, sum, {
                    from: standardAccounts.dummy1,
                });
                await masset.mint(basketManagerObj.mockToken1.address, sum, {
                    from: standardAccounts.dummy1,
                });
                let balance = await token.balanceOf(standardAccounts.dummy1);
                expect(balance.toString()).to.equal(`${sum}`);
                balance = await basketManagerObj.mockToken1.balanceOf(standardAccounts.dummy1);
                expect(balance.toString()).to.equal("900000000000000000");
                const tx = await masset.redeem(basketManagerObj.mockToken1.address, sum, {
                    from: standardAccounts.dummy1,
                });
                await expectEvent(tx.receipt, 'Redeemed', {
                    redeemer: standardAccounts.dummy1,
                    recipient: standardAccounts.dummy1,
                    massetQuantity: sum,
                    bAsset: basketManagerObj.mockToken1.address,
                    bassetQuantity: sum
                });
                balance = await token.balanceOf(standardAccounts.dummy1);
                expect(balance.toString()).to.equal(`0`);
                balance = await basketManagerObj.mockToken1.balanceOf(standardAccounts.dummy1);
                expect(balance.toString()).to.equal("1000000000000000000"); // original sum
            });
        });
        context("should fail", () => {
            it("if basset is invalid", async () => {
                await expectRevert.unspecified(
                    masset.redeem(ZERO_ADDRESS, 10));
            });
            it("if basset is not in the basket", async () => {
                await expectRevert.unspecified(
                    masset.redeem(mockTokenDummy.address, 10));
            });
            it("if amount is greater than the balance", async () => {
                await expectRevert.unspecified(
                    masset.redeem(basketManagerObj.mockToken1.address, 100000));
            });
        });
    });

    describe('reward manager integration', () => {
        let masset: MassetInstance;
        let basketManager; 
        let token;
        let rewardManager: MockRewardManagerInstance;
        let bassets;
        let basketManagerObj;
        beforeEach(async () => {
            masset = await Masset.new();
            token = await createToken(masset);
            basketManagerObj = await createBasketManager([18, 18], [1000, 1000], false);
            basketManager = basketManagerObj.basketManager;
            bassets = basketManagerObj.bassets;
            await masset.initialize(basketManager.address, token.address, false);
            rewardManager = await MockRewardManager.new(masset.address);
            await masset.setRewardManager(rewardManager.address);
        });
        context('withdrawal', () => {
            const amount = '1000000';
            const penalty = '1234';
            const finalAmount = '998766'
            beforeEach(async () => {
                await basketManagerObj.mockToken1.approve(masset.address, amount, 
                    { from: standardAccounts.dummy1 }
                );
                await masset.mint(basketManagerObj.mockToken1.address, amount, 
                    { from: standardAccounts.dummy1 }
                );
                await rewardManager.setGetPenaltyForWithdrawal_return(penalty);
            });
            it('without slippage protection', async () => {
                const tx = await masset.redeem(basketManagerObj.mockToken1.address, amount, 
                    { from: standardAccounts.dummy1 }
                );
                await expectEvent(tx.receipt, 'Redeemed', {
                    redeemer: standardAccounts.dummy1,
                    recipient: standardAccounts.dummy1,
                    massetQuantity: amount,
                    bAsset: basketManagerObj.mockToken1.address,
                    bassetQuantity: finalAmount
                });

                await expectEvent(tx.receipt, 'onPenaltyPaid', {
                    basset: basketManagerObj.mockToken1.address,
                    amount,
                    user: standardAccounts.dummy1,
                    penalty
                });

                const rmBalance = (await token.balanceOf(rewardManager.address)).toString();
                expect(rmBalance).to.eq(penalty);
            });
            it('with slippage protection, passing', async () => {

                const maximum = '2000';

                const tx = await masset.redeemWithMaximumPenalty(
                    basketManagerObj.mockToken1.address, amount, maximum,
                    { from: standardAccounts.dummy1 }
                );
                await expectEvent(tx.receipt, 'Redeemed', {
                    redeemer: standardAccounts.dummy1,
                    recipient: standardAccounts.dummy1,
                    massetQuantity: amount,
                    bAsset: basketManagerObj.mockToken1.address,
                    bassetQuantity: finalAmount
                });

                await expectEvent(tx.receipt, 'onPenaltyPaid', {
                    basset: basketManagerObj.mockToken1.address,
                    amount,
                    user: standardAccounts.dummy1,
                    penalty
                });

                const rmBalance = (await token.balanceOf(rewardManager.address)).toString();
                expect(rmBalance).to.eq(penalty);
            });
            it('with slippage protection, failing', async () => {

                const maximum = '1000';

                await expectRevert.unspecified(
                    masset.redeemWithMaximumPenalty(
                        basketManagerObj.mockToken1.address, amount, maximum,
                        { from: standardAccounts.dummy1 }
                    )                    
                );
            });
        });

        context('deposit', () => {
            const amount = '1000000';
            const reward = '1234';
            beforeEach(async () => {
                await rewardManager.setGetRewardForDeposit_return(reward);
                await rewardManager.setSendRewardForDepositCalled_return(reward);
                await basketManagerObj.mockToken1.approve(masset.address, amount, 
                    { from: standardAccounts.dummy1 }
                );
            });
            it('without slippage protection', async () => {

                const tx = await masset.mintTo(
                    basketManagerObj.mockToken1.address,
                    amount,
                    standardAccounts.dummy4,
                    { from: standardAccounts.dummy1 }
                );
                await expectEvent(tx.receipt, 'Minted', {
                    minter: standardAccounts.dummy1,
                    recipient: standardAccounts.dummy4,
                    massetQuantity: amount, 
                    bAsset: basketManagerObj.mockToken1.address,
                    bassetQuantity: amount
                });
                const balance = await token.balanceOf(standardAccounts.dummy4);
                expect(balance.toString()).to.equal(`${amount}`);

                expect(await rewardManager.sendRewardForDepositCalled()).to.eq(true);
                expect(await rewardManager.sendRewardForDepositCalled_recipient()).to.eq(standardAccounts.dummy4);
                expect((await rewardManager.sendRewardForDepositCalled_sum()).toString()).to.eq(amount);

                await expectEvent(tx.receipt, 'onRewardPaid', {
                    basset: basketManagerObj.mockToken1.address,
                    amount,
                    user: standardAccounts.dummy4,
                    reward
                });
            });
            it('with slippage protection', async () => {

                const minimum = '1000';

                const tx = await masset.mintToWithMinimumReward(
                    basketManagerObj.mockToken1.address,
                    amount,
                    standardAccounts.dummy4,
                    minimum,
                    { from: standardAccounts.dummy1 }
                );
                await expectEvent(tx.receipt, 'Minted', {
                    minter: standardAccounts.dummy1,
                    recipient: standardAccounts.dummy4,
                    massetQuantity: amount, 
                    bAsset: basketManagerObj.mockToken1.address,
                    bassetQuantity: amount
                });
                const balance = await token.balanceOf(standardAccounts.dummy4);
                expect(balance.toString()).to.equal(`${amount}`);

                expect(await rewardManager.sendRewardForDepositCalled()).to.eq(true);
                expect(await rewardManager.sendRewardForDepositCalled_recipient()).to.eq(standardAccounts.dummy4);
                expect((await rewardManager.sendRewardForDepositCalled_sum()).toString()).to.eq(amount);

                await expectEvent(tx.receipt, 'onRewardPaid', {
                    basset: basketManagerObj.mockToken1.address,
                    amount,
                    user: standardAccounts.dummy4,
                    reward
                });
            });
            it('with slippage protection, failing', async () => {

                const minimum = '2000';

                await expectRevert.unspecified(
                    masset.mintToWithMinimumReward(
                        basketManagerObj.mockToken1.address, amount, standardAccounts.dummy1, minimum,
                        { from: standardAccounts.dummy1 }
                    )                    
                );
            });
            context('bridge intergation', () => {

                beforeEach(async () => {
                    masset = await Masset.new();
                    token = await createToken(masset);
                    basketManagerObj = await createBasketManager([18, 18], [1000, 1000], true);
                    basketManager = basketManagerObj.basketManager;
                    bassets = basketManagerObj.bassets;
                    rewardManager = await MockRewardManager.new(masset.address);
                    await masset.initialize(basketManager.address, token.address, false);
                    await masset.setRewardManager(rewardManager.address);
                });
                
                it('bridge integration, passing', async () => {
                    const minimum = '0';
                    const recipient = standardAccounts.dummy4;
                    const userData = web3.eth.abi.encodeParameters(['address', 'uint256'], [recipient, minimum]);
    
                    await rewardManager.setGetRewardForDeposit_return(reward);

                    const tx = await masset.onTokensMinted(
                        amount, 
                        basketManagerObj.mockToken2.address,
                        userData,
                        { from: standardAccounts.bridge }
                    );
                    await expectEvent(tx.receipt, 'Minted', {
                        minter: standardAccounts.bridge,
                        recipient,
                        massetQuantity: amount, 
                        bAsset: basketManagerObj.mockToken2.address,
                        bassetQuantity: amount
                    });
                    const balance = await token.balanceOf(recipient);
                    expect(balance.toString()).to.equal(`${amount}`);
    
                    expect(await rewardManager.sendRewardForDepositCalled()).to.eq(true);
                    expect(await rewardManager.sendRewardForDepositCalled_recipient()).to.eq(recipient);
                    expect((await rewardManager.sendRewardForDepositCalled_sum()).toString()).to.eq(amount);
                });
                it('backward compatibility of bridge user data encoding', async () => {
                    const recipient = standardAccounts.bridge;
                    const minimum = '12345678';
                    const types = ['address', 'uint256'];
                    const userData = web3.eth.abi.encodeParameters(
                        types, 
                        [recipient, minimum]);
                    const result = web3.eth.abi.decodeParameters(types, userData);
                    expect(result[0]).to.eq(recipient);
                    expect(result[1]).to.eq(minimum);
    
                    const otherResult = web3.eth.abi.decodeParameters(['address'], userData);
                    expect(otherResult[0]).to.eq(recipient);
                });    
            });
        });
    });

});

async function createBasketManager(
    decimals: Array<number>,
    initialBalances: Array<number>,
    bridge: boolean
): Promise<any> {
    const tokens = [];
    for(let i = 0; i<decimals.length; i++) {
        tokens.push(await MockERC20.new("", "", decimals[i], standardAccounts.dummy1, initialBalances[i]));
    }
    const bassets = tokens.map(t => t.address);
    const basketManager = await BasketManager.new(bassets, bassets.map(()=>18), 
        bassets.map(() => bridge ? standardAccounts.bridge : ZERO_ADDRESS)
    );
    return {
        mockToken1: tokens[0],
        mockToken2: tokens[1],
        bassets,
        basketManager,
    };
}

async function createToken(masset: MassetInstance): Promise<any> {
    const token = await Token.new();
    await token.initialize('MASSET', 'MASSET', 18);
    await token.transferOwnership(masset.address);
    return token;
}

async function getBalance(token: any, who: string): Promise<string> {
    return (await token.balanceOf(who)).toString(10);
}
