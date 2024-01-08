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
    let rewardManager: RewardManagerInstance;
    let token: MockERC20Instance;
    let mockBasketManager: MockBasketManagerInstance;
    const mockTokens = [];

    before("before all", async () => {

        masset = await Masset.new();
        rewardManager = await RewardManager.new(address(masset));
        token = await MockERC20.new('XUSD', 'XUSD', 18, rewardManager.address, '1000000');
        mockBasketManager = await MockBasketManager.new();
        await masset.initialize(address(mockBasketManager), address(token), false);
        await masset.setRewardManager(rewardManager.address);
        for(let i=0; i<8; i++) {
            mockTokens.push((await MockERC20.new('', '', 18, sa.default, 0)).address);
        }
    });

    it("constructor", async () => {
        const newRewardManager = await RewardManager.new(address(masset));
        const version = await newRewardManager.getVersion();
        expect(version).eq('3.0');
    });

    describe("basic math", async () => {

        before(async () => {
        });

        it('getAverageDsqrs', async () => {
            for(const testCase of testCases) {
                await setTestCase(mockBasketManager, rewardManager, mockTokens, testCase);   
                const actualAmount = testCase.deposit ? floatToBn(testCase.amount) : floatToBn(-testCase.amount);
                const result: any = await rewardManager.getAverageDsqrs(mockTokens[testCase.tokenIndex], actualAmount);
                expect(
                    roundToN(toNumber(result.dsqrBefore), 7),
                    `testcase ${testCase.index} dsqrBefore`).to.eq(
                        roundToN(testCase.result.dsqrBefore, 7));
                expect(
                    roundToN(toNumber(result.dsqrAfter), 7),
                    `testcase ${testCase.index} dsqrAfter`).to.eq(
                        roundToN(testCase.result.dsqrAfter, 7));
            }
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
            let failed = false;
            for(const testCase of rewardTestcases) {
                await setTestCase(mockBasketManager, rewardManager, mockTokens, testCase);   
                const result = await rewardManager.getRewardForDeposit(mockTokens[testCase.tokenIndex], floatToBn(testCase.amount), false);
                const value = roundToN(toNumber(result), 7);
                const expected = roundToN(testCase.result.reward, 7);
                console.log(`testcase ${testCase.index}: value: ${value}, expected: ${expected}`);
                failed = failed || value !== expected;
            }
            if(failed) expect(false).eq(true);
        });

        it('getRewardForDeposit bridge mode', async () => {
          expect(rewardTestcases.length).greaterThanOrEqual(1);
          let failed = false;
          for(const testCase of rewardTestcases) {
              await setTestCaseLikeBridge(mockBasketManager, rewardManager, mockTokens, testCase);   
              const result = await rewardManager.getRewardForDeposit(mockTokens[testCase.tokenIndex], floatToBn(testCase.amount), true);
              const value = roundToN(toNumber(result), 7);
              const expected = roundToN(testCase.result.reward, 7);
              console.log(`testcase ${testCase.index}: value: ${value}, expected: ${expected}`);
              failed = failed || value !== expected;
          }
          if(failed) expect(false).eq(true);
      });

      it('getPenaltyForWithdrawal', async () => {
            expect(penaltyTestcases.length).greaterThanOrEqual(1);
            for(const testCase of penaltyTestcases ) {
                await setTestCase(mockBasketManager, rewardManager, mockTokens, testCase);   
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

async function setTestCase(mockBasketManager, rewardManager, mockTokens, testCase: TestCase) {
    await rewardManager.setFactor(floatToBn(testCase.factor));
    await rewardManager.setGlobalMaxPenaltyPerc(ONE.mul(new BN('100')));
    await rewardManager.setGlobalMaxRewardPerc(ONE.mul(new BN('100')));
      const targetWeights = testCase.targetWeights.map(n => floatToBn(n));
    const tokens = targetWeights.map((_, i) => mockTokens[i]);
    await rewardManager.setTargetWeights(tokens, targetWeights);
    let total = new BN(0);
    for(let i = 0; i < testCase.initialBalances.length; i++) {
        await mockBasketManager.setBalanceInMasset(tokens[i], floatToBn(testCase.initialBalances[i]));
        total = total.add(floatToBn(testCase.initialBalances[i]));
    }
    await mockBasketManager.setTotalBalanceInMasset(total);
}

async function setTestCaseLikeBridge(mockBasketManager, rewardManager, mockTokens, testCase: TestCase) {
  await rewardManager.setFactor(floatToBn(testCase.factor));
  await rewardManager.setGlobalMaxPenaltyPerc(ONE.mul(new BN('100')));
  await rewardManager.setGlobalMaxRewardPerc(ONE.mul(new BN('100')));
  const targetWeights = testCase.targetWeights.map(n => floatToBn(n));
  const tokens = targetWeights.map((_, i) => mockTokens[i]);
  await rewardManager.setTargetWeights(tokens, targetWeights);
  let total = new BN(0);
  for(let i = 0; i < testCase.initialBalances.length; i++) {
      let tokenBalance = floatToBn(testCase.initialBalances[i]);
      if(i === testCase.tokenIndex) tokenBalance = tokenBalance.add(floatToBn(testCase.amount));
      await mockBasketManager.setBalanceInMasset(tokens[i], tokenBalance);
      total = total.add(tokenBalance);
  }
  await mockBasketManager.setTotalBalanceInMasset(total);
}

function roundToN(v, n) {
    return Math.round(v * 10 ** n) / 10 ** n;
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
        initialBalances: [ 1000, 1000, 1000, 1000 ],
        targetWeights: [ 0.25, 0.25, 0.25, 0.25 ],
        factor: 1000,
        tokenIndex: 0,
        amount: 1000,
        deposit: true,
        result: { reward: 0, dsqrBefore: 0, dsqrAfter: 0.007500000000000001 },
      },
      {
        initialBalances: [ 0, 0, 0, 0 ],
        targetWeights: [ 1, 0, 0, 0 ],
        factor: 100,
        tokenIndex: 0,
        amount: 100,
        deposit: true,
        result: { reward: 33.33333333333333, dsqrBefore: 0.25, dsqrAfter: 0 },
      },
      {
        initialBalances: [ 0, 1000, 1000, 1000 ],
        targetWeights: [ 0.25, 0.25, 0.25, 0.25 ],
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
        initialBalances: [ 500, 1000, 1000, 1000 ],
        targetWeights: [ 0.25, 0.25, 0.25, 0.25 ],
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
        initialBalances: [ 900, 1000, 1000, 1000 ],
        targetWeights: [ 0.25, 0.25, 0.25, 0.25 ],
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
        initialBalances: [ 0, 1000, 1000, 1000 ],
        targetWeights: [ 0.7, 0.1, 0.1, 0.1 ],
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
        initialBalances: [ 0, 1000, 1000, 1000 ],
        targetWeights: [ 0.7, 0.1, 0.1, 0.1 ],
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
        initialBalances: [ 4000, 1000, 1000, 1000 ],
        targetWeights: [ 0.7, 0.1, 0.1, 0.1 ],
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
        initialBalances: [ 6000, 1000, 1000, 1000 ],
        targetWeights: [ 0.7, 0.1, 0.1, 0.1 ],
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
        initialBalances: [ 6000, 1000, 1000, 1000 ],
        targetWeights: [ 0.7, 0.1, 0.1, 0.1 ],
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
        initialBalances: [ 6000, 1000, 1000, 1000 ],
        targetWeights: [ 0.7, 0.1, 0.1, 0.1 ],
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
        initialBalances: [ 0, 1000, 1000, 1000 ],
        targetWeights: [ 0.7, 0.1, 0.1, 0.1 ],
        factor: 1000,
        tokenIndex: 0,
        amount: 7000,
        deposit: true,
        result: { reward: 195.21912351, dsqrBefore: 0.1633333333333333, dsqrAfter: 0 },
      },
      {
        initialBalances: [ 2000, 1000, 1000, 1000 ],
        targetWeights: [ 0.25, 0.25, 0.25, 0.25 ],
        factor: 1000,
        tokenIndex: 0,
        amount: 1000,
        withdrawal: true,
        result: { penalty: 0, dsqrBefore: 0.007500000000000001, dsqrAfter: 0 },
      },
      {
        initialBalances: [ 100, 0, 0, 0 ],
        targetWeights: [ 1, 0, 0, 0 ],
        factor: 100,
        tokenIndex: 0,
        amount: 100,
        withdrawal: true,
        result: { penalty: 33.33333333333333, dsqrBefore: 0, dsqrAfter: 0.25 },
      },
      {
        initialBalances: [ 1000, 1000, 1000, 1000 ],
        targetWeights: [ 0.25, 0.25, 0.25, 0.25 ],
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
        initialBalances: [ 1000, 1000, 1000, 1000 ],
        targetWeights: [ 1, 0, 0, 0 ],
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
        initialBalances: [ 1, 0, 0, 0 ],
        targetWeights: [ 1, 0, 0, 0 ],
        factor: 1,
        tokenIndex: 0,
        amount: 1,
        withdrawal: true,
        result: { penalty: 0.3333333333333333, dsqrBefore: 0, dsqrAfter: 0.25 },
      },
      {
        initialBalances: [ 1000, 1000, 1000, 1000 ],
        targetWeights: [ 1, 0, 0, 0 ],
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
        initialBalances: [ 1000000, 1000000, 1000000, 1000000 ],
        targetWeights: [ 1, 0, 0, 0 ],
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
        initialBalances: [ 1000, 1000, 1000, 1000 ],
        targetWeights: [ 1, 0, 0, 0 ],
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
        initialBalances: [ 1000, 1000, 1000, 1000 ],
        targetWeights: [ 1, 0, 0, 0 ],
        factor: 4000,
        tokenIndex: 0,
        amount: 1000,
        withdrawal: true,
        result: { penalty: 1000, dsqrBefore: 0.1875, dsqrAfter: 0.33333333333333337 },
      },
      {
        initialBalances: [ 1000, 1000, 1000, 1000 ],
        targetWeights: [ 1, 0, 0, 0 ],
        factor: 10000,
        tokenIndex: 0,
        amount: 1000,
        withdrawal: true,
        result: { penalty: 1000, dsqrBefore: 0.1875, dsqrAfter: 0.33333333333333337 },
      },
      {
        initialBalances: [ 0, 0, 0, 1000 ],
        targetWeights: [ 0.25, 0.25, 0.25, 0.25 ],
        factor: 10000,
        tokenIndex: 0,
        amount: 4000,
        deposit: true,
        result: { reward: 0, dsqrBefore: 0.1875, dsqrAfter: 0.1075 },
      }    

    
];
for(let i=0; i<testCases.length; i++) (testCases[i] as any).index = i;
