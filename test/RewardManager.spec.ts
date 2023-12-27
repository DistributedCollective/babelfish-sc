/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable @typescript-eslint/no-use-before-define */
import { StandardAccounts } from "@utils/standardAccounts";
import envSetup from "@utils/env_setup";
import BN from "bn.js";
import { MassetInstance, MockBasketManagerInstance, MockERC20Instance, RewardManagerInstance } from "types/generated";
import { ZERO_ADDRESS } from "@utils/constants";

const { expect } = envSetup.configure();

const RewardManager = artifacts.require("RewardManager");
const Masset = artifacts.require("Masset");
const MockERC20 = artifacts.require("MockERC20");
const MockBasketManager = artifacts.require("MockBasketManager");

const ONE = new BN('1000000000000000000');

contract("RewardManager", async (accounts) => {
  const sa = new StandardAccounts(accounts);

  let masset: MassetInstance;
  let token: MockERC20Instance;
  let mockBasketManager: MockBasketManagerInstance;
  const mockTokens = [];

  before("before all", async () => {
    masset = await Masset.new();
    token = await MockERC20.new('XUSD', 'XUSD', 18, sa.default, '1000000');
    mockBasketManager = await MockBasketManager.new();
    await masset.initialize(address(mockBasketManager), address(token), false);
  });

  describe('constructor', async () => {
    it('first RM', async () => {
      const newRewardManager = await RewardManager.new(address(masset), false);
      const version = await newRewardManager.getVersion();
      expect(version).eq('4.0');  
    });
    it('copies previous RM', async () => {
      const fakeFactor = 1234;
      const fakeMaxPenalty = 5678;
      const fakeMaxReward = 9123;

      const oldRewardManager = await RewardManager.new(address(masset), false);
      await masset.setRewardManager(oldRewardManager.address);

      await oldRewardManager.setFactor(fakeFactor);
      await oldRewardManager.setGlobalMaxPenaltyPerc(fakeMaxPenalty);
      await oldRewardManager.setGlobalMaxRewardPerc(fakeMaxReward);
      const mockToken1 = await MockERC20.new('', '', 18, masset.address, 0);
      const mockToken2 = await MockERC20.new('', '', 18, masset.address, 0);
      const fakeTokens = [ mockToken1.address, mockToken2.address ];
      const fakeTargetWeights = [ '500000000000000001', '499999999999999999' ];
      await oldRewardManager.setTargetWeights(fakeTokens, fakeTargetWeights);
      
      const newRewardManager = await RewardManager.new(address(masset), true);
      await masset.setRewardManager(newRewardManager.address);

      expect((await newRewardManager.getFactor()).toNumber()).to.eq(fakeFactor);
      expect((await newRewardManager.getGlobalMaxPenaltyPerc()).toNumber()).to.eq(fakeMaxPenalty);
      expect((await newRewardManager.getGlobalMaxRewardPerc()).toNumber()).to.eq(fakeMaxReward);
      expect(await newRewardManager.getTokens()).to.deep.eq(fakeTokens);
      expect((await newRewardManager.getTargetWeights()).map(n => n.toString())).to.deep.eq(fakeTargetWeights);
    });
  });

  describe("basic math", async () => {

    before(async () => {
    });

    describe('getAverageDsqrs', async () => {
      it('testcase', async () => {
        for (const testCase of testCases) {
          //if (testCase.index != 16) continue;
          //console.log(`testcase ${testCase.index}`);
          const { rewardManager, mockTokens } = await setTestCase(masset, token, testCase);
          //await getTokenBalances(rewardManager);
          //const totalBalance = await rewardManager.getTotalBalanceInMasset();
          const actualAmount = testCase.deposit ? floatToBn(testCase.amount) : floatToBn(-testCase.amount);
          //console.log('totalBalance', totalBalance.toString(), 'actualAmount', actualAmount.toString());
          const result: any = await rewardManager.getAverageDsqrs(mockTokens[testCase.tokenIndex], actualAmount);
          //console.log(`testcase ${testCase.index} before:`, roundToN(toNumber(result[0]), 7), roundToN(testCase.result.dsqrBefore, 7));
          //console.log(`testcase ${testCase.index} after:`, roundToN(toNumber(result[1]), 7), roundToN(testCase.result.dsqrAfter, 7));
          expect(roundToN(toNumber(result.dsqrBefore), 7)).to.eq(roundToN(testCase.result.dsqrBefore, 7));
          expect(roundToN(toNumber(result.dsqrAfter), 7)).to.eq(roundToN(testCase.result.dsqrAfter, 7));
        }
      });
    });
  });

  describe("incentive functions", async () => {

    let rewardTestcases; let penaltyTestcases;

    before(() => {
      rewardTestcases = testCases.filter(t => t.deposit);
      penaltyTestcases = testCases.filter(t => t.withdrawal);
    });

    it('getRewardForDeposit', async () => {
      expect(rewardTestcases.length).greaterThanOrEqual(1);
      for (const testCase of rewardTestcases) {
        const { rewardManager, mockTokens } = await setTestCase(masset, token, testCase);
        const result = await rewardManager.getRewardForDeposit(mockTokens[testCase.tokenIndex], floatToBn(testCase.amount), false);
        const value = roundToN(toNumber(result), 7);
        const expected = roundToN(testCase.result.reward, 7);
        //console.log(`testcase ${testCase.index}: value: ${value}, expected: ${expected}`);
        expect(value).to.eq(expected);
      }
    });

    it('getRewardForDeposit bridge mode', async () => {
      expect(rewardTestcases.length).greaterThanOrEqual(1);
      for (const testCase of rewardTestcases) {
        const { rewardManager, mockTokens } = await setTestCaseBridgeMode(masset, token, testCase);
        //await getTokenBalances(rewardManager);
        const totalBalance = await rewardManager.getTotalBalanceInMasset();
        const actualAmount = testCase.deposit ? floatToBn(testCase.amount) : floatToBn(-testCase.amount);
        //console.log('totalBalance', totalBalance.toString(), 'actualAmount', actualAmount.toString());

        const result = await rewardManager.getRewardForDeposit(mockTokens[testCase.tokenIndex], floatToBn(testCase.amount), true);
        const value = roundToN(toNumber(result), 7);
        const expected = roundToN(testCase.result.reward, 7);
        //console.log(`testcase ${testCase.index}: value: ${value}, expected: ${expected}`);
        expect(value).to.eq(expected);
      }
    });

    it('getPenaltyForWithdrawal', async () => {
      expect(penaltyTestcases.length).greaterThanOrEqual(1);
      for (const testCase of penaltyTestcases) {
        const { rewardManager, mockTokens } = await setTestCase(masset, token, testCase);
        const result = await rewardManager.getPenaltyForWithdrawal(mockTokens[testCase.tokenIndex], floatToBn(testCase.amount));
        expect(
          roundToN(toNumber(result), 7),
          `testcase ${testCase.index}`).eq(
            roundToN(testCase.result.penalty, 7));
      };
    });
  });
});

function address(c): string {
  return (c as any).address;
}

function toNumber(bn: BN): number {
  return bn.div(new BN('10000000000')).toNumber() / 100000000;
}

function floatToBn(n: number): BN {
  return (new BN(n * 1000000)).mul(new BN('1000000000000'));
}

async function setTestCase(masset: MassetInstance, token: MockERC20Instance, testCase: TestCase) {
  const rewardManager = await RewardManager.new(masset.address, false);
  await token.mint(rewardManager.address, ONE.mul(new BN('1000000')));
  const mockTokens = [];
  await masset.setRewardManager(rewardManager.address);
  for (let i = 0; i < testCase.initialBalances.length; i++) {
    const mockToken = await MockERC20.new('', '', 18, masset.address, testCase.initialBalances[i]);
    mockTokens[i] = mockToken.address;
  }
  await rewardManager.setFactor(floatToBn(testCase.factor));
  await rewardManager.setGlobalMaxPenaltyPerc(ONE.mul(new BN('100')));
  await rewardManager.setGlobalMaxRewardPerc(ONE.mul(new BN('100')));
  const targetWeights = testCase.targetWeights.map(n => floatToBn(n));
  await rewardManager.setTargetWeights(mockTokens, targetWeights);
  return { rewardManager, mockTokens };
}

async function setTestCaseBridgeMode(masset: MassetInstance, token: MockERC20Instance, testCase: TestCase) {
  const rewardManager = await RewardManager.new(masset.address, false);
  await token.mint(rewardManager.address, ONE.mul(new BN('1000000')));
  const mockTokens = [];
  await masset.setRewardManager(rewardManager.address);
  for (let i = 0; i < testCase.initialBalances.length; i++) {
    let tokenBalance = new BN(testCase.initialBalances[i]);
    if (i == testCase.tokenIndex) tokenBalance = tokenBalance.add(new BN(testCase.amount));
    const mockToken = await MockERC20.new('', '', 18, masset.address, tokenBalance);
    mockTokens[i] = mockToken.address;
  }
  await rewardManager.setFactor(floatToBn(testCase.factor));
  await rewardManager.setGlobalMaxPenaltyPerc(ONE.mul(new BN('100')));
  await rewardManager.setGlobalMaxRewardPerc(ONE.mul(new BN('100')));
  const targetWeights = testCase.targetWeights.map(n => floatToBn(n));
  await rewardManager.setTargetWeights(mockTokens, targetWeights);
  return { rewardManager, mockTokens };
}

async function getTokenBalances(rewardManager: RewardManagerInstance) {
  const tokens = await rewardManager.getTokens();
  const massetAddress = await rewardManager.getMassetAddress();
  const balances = tokens.map(async tokenAddress => {
    const token = await MockERC20.at(tokenAddress);
    const balance = await token.balanceOf(massetAddress);
    console.log(`balance of ${tokenAddress}: ${balance.toString()}`);
  });
  return balances;
}

function roundToN(v, n) {
  return Math.round(v * Math.pow(10, n)) / Math.pow(10, n);
}

class TestCase {
  index?: number;

  initialBalances: number[];

  targetWeights: number[];

  factor: number;

  tokenIndex: number;

  amount: number;

  withdrawal?: boolean;

  deposit?: boolean;

  result: { penalty?: number, reward?: number, dsqrBefore: number, dsqrAfter: number };

  resultPerc?: number;
}


const testCases: TestCase[] = [
  {
    deposit: true,
    withdrawal: true,
    factor: 0,
    initialBalances: [1000, 1000, 1000, 1000],
    targetWeights: [0, 0, 0, 1],
    tokenIndex: 0,
    amount: 1000,
    result: { dsqrBefore: 0.1875, dsqrAfter: 0.22, penalty: 0, reward: 0 }
  },
  {
    deposit: true,
    withdrawal: true,
    factor: 0,
    initialBalances: [1000, 1000, 1000, 1000],
    targetWeights: [0.25, 0.25, 0.25, 0.25],
    tokenIndex: 0,
    amount: 1000,
    result: { dsqrBefore: 0, dsqrAfter: 0.0075, penalty: 0, reward: 0 }
  },
  {
    deposit: true,
    withdrawal: false,
    factor: 0,
    initialBalances: [0, 1000, 1000, 1000],
    targetWeights: [0.25, 0.25, 0.25, 0.25],
    tokenIndex: 0,
    amount: 1000,
    result: { dsqrBefore: 0.02083333, dsqrAfter: 0, penalty: 0, reward: 0 }
  },
  {
    deposit: true,
    withdrawal: true,
    factor: 1000,
    initialBalances: [1000, 1000, 1000, 1000],
    targetWeights: [0.25, 0.25, 0.25, 0.25],
    tokenIndex: 0,
    amount: 1000,
    result: { dsqrBefore: 0, dsqrAfter: 0.0075, penalty: 21.27659574, reward: 0 }
  },
  {
    initialBalances: [1000, 1000, 1000, 1000],
    targetWeights: [0.25, 0.25, 0.25, 0.25],
    factor: 1000,
    tokenIndex: 0,
    amount: 1000,
    deposit: true,
    result: { reward: 0, dsqrBefore: 0, dsqrAfter: 0.007500000000000001 },
  },
  {
    initialBalances: [0, 0, 0, 0],
    targetWeights: [1, 0, 0, 0],
    factor: 100,
    tokenIndex: 0,
    amount: 100,
    deposit: true,
    result: { reward: 33.33333333333333, dsqrBefore: 0.25, dsqrAfter: 0 },
  },
  {
    initialBalances: [0, 1000, 1000, 1000],
    targetWeights: [0.25, 0.25, 0.25, 0.25],
    factor: 100,
    tokenIndex: 0,
    amount: 1000,
    deposit: true,
    result: {
      reward: 2.1276595744680854,
      dsqrBefore: 0.020833333333333336,
      dsqrAfter: 0
    },
  },
  {
    initialBalances: [500, 1000, 1000, 1000],
    targetWeights: [0.25, 0.25, 0.25, 0.25],
    factor: 500,
    tokenIndex: 0,
    amount: 500,
    deposit: true,
    result: {
      reward: 1.9206145966709343,
      dsqrBefore: 0.003826530612244897,
      dsqrAfter: 0
    },
  },
  {
    initialBalances: [900, 1000, 1000, 1000],
    targetWeights: [0.25, 0.25, 0.25, 0.25],
    factor: 100,
    tokenIndex: 0,
    amount: 100,
    deposit: true,
    result: {
      reward: 0.01232893601282206,
      dsqrBefore: 0.00012327416173569985,
      dsqrAfter: 0
    },
  },
  {
    initialBalances: [0, 1000, 1000, 1000],
    targetWeights: [0.7, 0.1, 0.1, 0.1],
    factor: 1000,
    tokenIndex: 0,
    amount: 1000,
    deposit: true,
    result: {
      reward: 122.83306452474282,
      dsqrBefore: 0.1633333333333333,
      dsqrAfter: 0.06749999999999999
    },
  },
  {
    initialBalances: [0, 1000, 1000, 1000],
    targetWeights: [0.7, 0.1, 0.1, 0.1],
    factor: 4000,
    tokenIndex: 0,
    amount: 4000,
    deposit: true,
    result: {
      reward: 758.7135553824103,
      dsqrBefore: 0.1633333333333333,
      dsqrAfter: 0.005510204081632651
    },
  },
  {
    initialBalances: [4000, 1000, 1000, 1000],
    targetWeights: [0.7, 0.1, 0.1, 0.1],
    factor: 1000,
    tokenIndex: 0,
    amount: 1000,
    deposit: true,
    result: {
      reward: 3.6622124311937734,
      dsqrBefore: 0.005510204081632651,
      dsqrAfter: 0.0018749999999999982
    },
  },
  {
    initialBalances: [6000, 1000, 1000, 1000],
    targetWeights: [0.7, 0.1, 0.1, 0.1],
    factor: 1000,
    tokenIndex: 0,
    amount: 1000,
    deposit: true,
    result: {
      reward: 0.37050759540570555,
      dsqrBefore: 0.0003703703703703701,
      dsqrAfter: 0
    },
  },
  {
    initialBalances: [6000, 1000, 1000, 1000],
    targetWeights: [0.7, 0.1, 0.1, 0.1],
    factor: 2000,
    tokenIndex: 0,
    amount: 1000,
    deposit: true,
    result: {
      reward: 0.7410151908114111,
      dsqrBefore: 0.0003703703703703701,
      dsqrAfter: 0
    },
  },
  {
    initialBalances: [6000, 1000, 1000, 1000],
    targetWeights: [0.7, 0.1, 0.1, 0.1],
    factor: 4000,
    tokenIndex: 0,
    amount: 1000,
    deposit: true,
    result: {
      reward: 1.4820303816228222,
      dsqrBefore: 0.0003703703703703701,
      dsqrAfter: 0
    },
  },
  {
    initialBalances: [0, 1000, 1000, 1000],
    targetWeights: [0.7, 0.1, 0.1, 0.1],
    factor: 1000,
    tokenIndex: 0,
    amount: 7000,
    deposit: true,
    result: { reward: 195.21912351, dsqrBefore: 0.1633333333333333, dsqrAfter: 0 },
  },
  {
    initialBalances: [2000, 1000, 1000, 1000],
    targetWeights: [0.25, 0.25, 0.25, 0.25],
    factor: 1000,
    tokenIndex: 0,
    amount: 1000,
    withdrawal: true,
    result: { penalty: 0, dsqrBefore: 0.007500000000000001, dsqrAfter: 0 },
  },
  {
    initialBalances: [100, 0, 0, 0],
    targetWeights: [1, 0, 0, 0],
    factor: 100,
    tokenIndex: 0,
    amount: 100,
    withdrawal: true,
    result: { penalty: 33.33333333333333, dsqrBefore: 0, dsqrAfter: 0.25 },
  },
  {
    initialBalances: [1000, 1000, 1000, 1000],
    targetWeights: [0.25, 0.25, 0.25, 0.25],
    factor: 1000,
    tokenIndex: 0,
    amount: 1000,
    withdrawal: true,
    result: {
      penalty: 21.276595744680854,
      dsqrBefore: 0,
      dsqrAfter: 0.020833333333333336
    },
  },
  {
    initialBalances: [1000, 1000, 1000, 1000],
    targetWeights: [1, 0, 0, 0],
    factor: 500,
    tokenIndex: 0,
    amount: 500,
    withdrawal: true,
    result: {
      penalty: 46.77754677754681,
      dsqrBefore: 0.1875,
      dsqrAfter: 0.2448979591836735
    },
  },
  {
    initialBalances: [1, 0, 0, 0],
    targetWeights: [1, 0, 0, 0],
    factor: 1,
    tokenIndex: 0,
    amount: 1,
    withdrawal: true,
    result: { penalty: 0.3333333333333333, dsqrBefore: 0, dsqrAfter: 0.25 },
  },
  {
    initialBalances: [1000, 1000, 1000, 1000],
    targetWeights: [1, 0, 0, 0],
    factor: 1000,
    tokenIndex: 0,
    amount: 1000,
    withdrawal: true,
    result: {
      penalty: 269.23076923076934,
      dsqrBefore: 0.1875,
      dsqrAfter: 0.33333333333333337
    },
  },
  {
    initialBalances: [1000000, 1000000, 1000000, 1000000],
    targetWeights: [1, 0, 0, 0],
    factor: 1000000,
    tokenIndex: 0,
    amount: 1000000,
    withdrawal: true,
    result: {
      penalty: 269230.7692307693,
      dsqrBefore: 0.1875,
      dsqrAfter: 0.33333333333333337
    },
  },
  {
    initialBalances: [1000, 1000, 1000, 1000],
    targetWeights: [1, 0, 0, 0],
    factor: 2000,
    tokenIndex: 0,
    amount: 1000,
    withdrawal: true,
    result: {
      penalty: 538.4615384615387,
      dsqrBefore: 0.1875,
      dsqrAfter: 0.33333333333333337
    },
  },
  {
    initialBalances: [1000, 1000, 1000, 1000],
    targetWeights: [1, 0, 0, 0],
    factor: 4000,
    tokenIndex: 0,
    amount: 1000,
    withdrawal: true,
    result: { penalty: 1000, dsqrBefore: 0.1875, dsqrAfter: 0.33333333333333337 },
  },
  {
    initialBalances: [1000, 1000, 1000, 1000],
    targetWeights: [1, 0, 0, 0],
    factor: 10000,
    tokenIndex: 0,
    amount: 1000,
    withdrawal: true,
    result: { penalty: 1000, dsqrBefore: 0.1875, dsqrAfter: 0.33333333333333337 },
  },
  {
    initialBalances: [0, 0, 0, 1000],
    targetWeights: [0.25, 0.25, 0.25, 0.25],
    factor: 10000,
    tokenIndex: 0,
    amount: 4000,
    deposit: true,
    result: { reward: 0, dsqrBefore: 0.1875, dsqrAfter: 0.1075 },
  }


];
for (let i = 0; i < testCases.length; i++) (testCases[i] as any).index = i;
