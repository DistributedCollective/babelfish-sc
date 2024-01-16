/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable @typescript-eslint/no-use-before-define */
import { StandardAccounts } from "@utils/standardAccounts";
import envSetup from "@utils/env_setup";
import BN from "bn.js";
import { BonusManagerInstance, MockERC20Instance, MockMassetForBonusManagerTestingInstance, MockRewardManagerInstance } from "types/generated";
import { ZERO, ZERO_ADDRESS } from "@utils/constants";
import { expectRevert, expectEvent } from "@openzeppelin/test-helpers";

const { expect } = envSetup.configure();

const MockRewardManager = artifacts.require("MockRewardManager");
const BonusManager = artifacts.require("BonusManager");
const MockERC20 = artifacts.require("MockERC20");
const MockMassetForBonusManagerTesting = artifacts.require("MockMassetForBonusManagerTesting");

const ONE = new BN('1000000000000000000');
const ONEHUNDRED = new BN('100').mul(ONE);
const ONEHALF = ONE.div(new BN('2'));
const ONEMILLION = ONE.mul(new BN('1000000'));
const TENMILLION = ONE.mul(new BN('10000000'));

contract("BonusManager", async (accounts) => {
    const sa = new StandardAccounts(accounts);
    const notOwner = sa.other;

    let mockMasset: MockMassetForBonusManagerTestingInstance;
    let mockRewardManager: MockRewardManagerInstance;
    let bonusManager: BonusManagerInstance;
    let token: MockERC20Instance;
    const mockTokens = [];

    beforeEach("before each", async () => {
        for (let i = 0; i < 1; i++) {
            mockTokens.push((await MockERC20.new('', '', 18, sa.default, 0)).address);
        }
        mockMasset = await MockMassetForBonusManagerTesting.new();
        bonusManager = await BonusManager.new(mockMasset.address);
        await bonusManager.setTokens(mockTokens);
        await mockMasset.setBonusManager(bonusManager.address);

        mockRewardManager = await MockRewardManager.new(mockMasset.address);
        await mockMasset.setRewardManager(mockRewardManager.address);

        token = await MockERC20.new('XUSD', 'XUSD', 18, bonusManager.address, '1000000');
        await mockMasset.setToken(token.address);
        await mockMasset.setRewardManager(mockRewardManager.address);
        await mockMasset.setBonusManager(bonusManager.address);

        await mockRewardManager.setGetPenaltyForWithdrawal_return(ONEMILLION);
        await mockRewardManager.setGetRewardForDeposit_return(ZERO);
    });

    it("constructor", async () => {
        const newBonusManager = await BonusManager.new(mockMasset.address);
        const version = await newBonusManager.getVersion();
        console.log(version);
        expect(version).eq('1.0');
    });

    describe('setters', async () => {

        describe('they work', async () => {
            const randBN = () => new BN(Math.floor(Math.random() * 1000000));
            const tests = {
                setAmountMultiplier: ['getAmountMultiplier', ZERO, randBN()],
                setRewardMultiplier: ['getRewardMultiplier', ZERO, randBN()],
                setMaximumBonus: ['getMaximumBonus', ZERO, randBN()],
                setMinimumAmount: ['getMinimumAmount', ZERO, randBN()],
                setTokens: ['getTokens', [], mockTokens]
            };
            for (const setFnName of Object.keys(tests)) {
                it(`setter: ${  setFnName}`, async () => {
                    const [getFnName, before, after] = tests[setFnName];
                    await bonusManager[setFnName](before);
                    const actualBefore = await bonusManager[getFnName]();
                    expect(actualBefore.toString()).to.eq(before.toString());
                    await bonusManager[setFnName](after);
                    const actualAfter = await bonusManager[getFnName]();
                    expect(actualAfter.toString()).to.eq(after.toString());
                });
            }
        });

        describe('security', async () => {
            const tests = {
                setAmountMultiplier: () => bonusManager.setAmountMultiplier(ZERO, { from: notOwner }),
                setRewardMultiplier: () => bonusManager.setRewardMultiplier(ZERO, { from: notOwner }),
                setMaximumBonus: () => bonusManager.setMaximumBonus(ZERO, { from: notOwner }),
                setMinimumAmount: () => bonusManager.setMinimumAmount(ZERO, { from: notOwner }),
                setTokens: () => bonusManager.setTokens([], { from: notOwner })
            };
            for (const key of Object.keys(tests)) {
                it(`setter: ${  key}`, async () => {
                    await expectRevert(tests[key](), 'not the owner');
                });
            }
        });
    });


    const setBonusParams = async (rewardFactor, amountFactor, minimumAmount, maximumBonus, paused = false) => {
        await bonusManager.setRewardMultiplier(rewardFactor);
        await bonusManager.setAmountMultiplier(amountFactor);
        await bonusManager.setMinimumAmount(minimumAmount);
        await bonusManager.setMaximumBonus(maximumBonus);
        await bonusManager.setPaused(paused);
    };

    describe('getPredictedBonus', async () => {

        it('returns some number (to prevent false positives)', async () => {
            await setBonusParams(ONE, ONE, ZERO, ONE);
            const bonus = await bonusManager.getPredictedBonus(mockTokens[0], ONE);
            expect(bonus.toString()).to.not.eq('0');
        });

        it('if unknown token returns 0', async () => {
            const fubarToken = (await MockERC20.new('', '', 18, sa.default, 0)).address;
            await setBonusParams(ONE, ONE, ZERO, ONEHUNDRED); // has to return something > 0
            const bonus = await bonusManager.getPredictedBonus(fubarToken, ONEHUNDRED);
            expect(bonus.toString()).to.eq('0');
        });

        it('if paused token returns 0', async () => {
            await setBonusParams(ONE, ONE, ZERO, ONEHUNDRED, true);
            const bonus = await bonusManager.getPredictedBonus(mockTokens[0], ONEHUNDRED);
            expect(bonus.toString()).to.eq('0');
        });

        it('if amount is under minimum return 0', async () => {
            await setBonusParams(ONE, ONE, ONE, ONEHUNDRED);
            const bonus = await bonusManager.getPredictedBonus(mockTokens[0], ONEHALF);
            expect(bonus.toString()).to.eq('0');
        });

        it('if bonus is over maximum return maximum', async () => {
            await setBonusParams(ONE, ONE, ONE, ONEHALF);
            const bonus = await bonusManager.getPredictedBonus(mockTokens[0], ONE);
            expect(bonus.toString()).to.eq(ONEHALF.toString());
        });

        it('if bonus is over the balanace return the balance', async () => {
            const balance = await token.balanceOf(bonusManager.address);
            await mockRewardManager.setGetPenaltyForWithdrawal_return(TENMILLION);
            await setBonusParams(ONE, ONE, ONE, TENMILLION);
            const bonus = await bonusManager.getPredictedBonus(mockTokens[0], TENMILLION);
            expect(bonus.toString()).to.eq(balance.toString());
        });

        it('returns correct bonus for amount', async () => {
            const multiplier = ONE.mul(new BN(3.8 * 100)).div(new BN('10000'));
            const amount = ONE.mul(new BN(8));
            await setBonusParams(ZERO, multiplier, ZERO, ONEHUNDRED);
            const bonus = await bonusManager.getPredictedBonus(mockTokens[0], amount);
            const expected = multiplier.mul(amount).div(ONE);
            expect(bonus.toString()).to.eq(expected.toString());
        });

        it('returns correct bonus for reward', async () => {
            const multiplier = ONE.mul(new BN(3.8 * 100)).div(new BN('10000'));
            const amount = ONE.mul(new BN(8));
            await setBonusParams(multiplier, ZERO, ZERO, ONEHUNDRED);
            await mockRewardManager.setGetRewardForDeposit_return(amount);
            const bonus = await bonusManager.getPredictedBonus(mockTokens[0], ZERO);
            const expected = multiplier.mul(amount).div(ONE);
            expect(bonus.toString()).to.eq(expected.toString());
        });

        it('returns correct bonus for reward and amount combined', async () => {
            const amountMultiplier = ONE.mul(new BN(3.8 * 100)).div(new BN('10000'));
            const rewardMultiplier = ONE.mul(new BN(7.1 * 100)).div(new BN('10000'));
            const amount = ONE.mul(new BN(873));
            const reward = ONE.mul(new BN(249));
            await setBonusParams(rewardMultiplier, amountMultiplier, ZERO, ONEHUNDRED);
            await mockRewardManager.setGetRewardForDeposit_return(reward);
            const bonus = await bonusManager.getPredictedBonus(mockTokens[0], amount);
            const expected = amountMultiplier.mul(amount).div(ONE).add(rewardMultiplier.mul(reward).div(ONE));
            expect(bonus.toString()).to.eq(expected.toString());
        });

        it('reward + bonus is not greater than the penalty', async () => {
            const penalty = ONE.mul(new BN(366));
            const reward = ONE.mul(new BN(249));
            await mockRewardManager.setGetRewardForDeposit_return(reward);
            await mockRewardManager.setGetPenaltyForWithdrawal_return(penalty);
            await setBonusParams(ZERO, ONE, ZERO, TENMILLION);
            const bonus = await bonusManager.getPredictedBonus(mockTokens[0], ONEMILLION);
            const expected = penalty.sub(reward);
            expect(bonus.toString()).to.eq(expected.toString());
        });

    });

    describe('extractTokens', async () => {

        it('only owner may call', async () => {
            await expectRevert(bonusManager.extractFunds(token.address, ONE, { from: sa.dummy1 }), 'caller is not the owner');
        });

        it('sends funds', async () => {
            const amount = new BN(321).mul(ONE);
            const balanceBefore = await token.balanceOf(sa.default);
            await bonusManager.extractFunds(token.address, amount);
            const balanceAfter = await token.balanceOf(sa.default);
            const actual = balanceAfter.sub(balanceBefore);
            expect(actual.toString()).to.eq(amount.toString());
        });
    });

    describe('sendBonus', async () => {

        it('only masset may call', async () => {
            await setBonusParams(ZERO, ZERO, ZERO, ONEHUNDRED);
            await expectRevert(bonusManager.sendBonus(mockTokens[0], sa.dummy3, ONE), 'not allowed');
        });

        it('sends the tokens correctly', async () => {
            await setBonusParams(ZERO, ONE, ZERO, ONEHUNDRED);
            await mockRewardManager.setGetRewardForDeposit_return(ZERO);
            await mockRewardManager.setGetPenaltyForWithdrawal_return(ONEMILLION);
            const amount = ONE;
            const bonus = await bonusManager.getPredictedBonus(mockTokens[0], amount);
            expect(bonus.toString()).to.eq(ONE.toString());
            const balanceBefore = await token.balanceOf(sa.dummy3);
            const tx = await mockMasset.sendBonus(mockTokens[0], sa.dummy3, amount, { from: sa.default });
            const balanceAfter = await token.balanceOf(sa.dummy3);
            const actual = balanceAfter.sub(balanceBefore);
            expect(actual.toString()).to.eq(bonus.toString());
        });
    });
});

function toNumber(bn: BN): number {
    return bn.div(new BN('10000000000')).toNumber() / 100000000;
}

function floatToBn(n: number): BN {
    return (new BN(n * 1000000)).mul(new BN('1000000000000'));
}

function roundToN(v, n) {
    return Math.round(v *10 ** n) / 10 ** n;
}