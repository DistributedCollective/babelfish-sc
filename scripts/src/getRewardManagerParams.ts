import HDWalletProvider from '@truffle/hdwallet-provider';
import state from '../../migrations/state';
import BN from "bn.js";
import { BasketManagerInstance, MassetInstance, MassetProxyInstance } from 'types/generated';
import { RewardManagerInstance } from 'types/generated/RewardManager';
import { ZERO_ADDRESS } from '@utils/constants';
import { knownTokens, knownTokensAddressToName } from './knownTokens';

const ONE = new BN('1000000000000000000');
const PERC_FACTOR = new BN(100);

function bnPerc(a: BN, b: BN) {
    const n = a.mul(PERC_FACTOR).mul(PERC_FACTOR).div(b).toNumber() / 100;
    return `${n}%`;
}

function bnToNumber(bn: BN) {
    bn = bn.div(new BN(1000000000));
    return bn.toNumber() / 1000000000;
}

export default async function getParams(truffle): Promise<any> {

    const artifacts = truffle.artifacts;
    const provider = truffle.web3.currentProvider;
    const network = truffle.artifacts.options.network;
    state.setNetwork(network);

    console.log(provider.getAddress(0), provider.getAddress(1));

    const tokens = knownTokens[network];

    const Masset = artifacts.require("Masset");
    const fake = await state.getDeployed(Masset, 'MassetProxy');
    const tokenNames = knownTokensAddressToName[network];
    //const rewardManagerAddress = await (fake as MassetInstance).getRewardManager();
    const rewardManagerAddress = '0xdfE234575c04F8Ad29Bea2c1546799e677022021';
    console.log('Current reward manager: ', rewardManagerAddress);
    
    const massetOwner = await fake.owner();
    console.log('Masset owner: ', massetOwner);

    console.log('rewardManagerAddress', rewardManagerAddress);
    const RewardManager = artifacts.require("RewardManager");
    const rewardManager = await RewardManager.at(rewardManagerAddress);

    const owner = await (rewardManager as RewardManagerInstance).owner();
    console.log('Owner: ', owner);

    const BasketManager = artifacts.require("BasketManager");
    const basketManager = await state.getDeployed(BasketManager, 'BasketManager');

    const rmTokens = await (rewardManager as RewardManagerInstance).getTokens();

    const totalBalance = await (basketManager as BasketManagerInstance).getTotalBalanceInMasset(fake.address);
    console.log('totalBalance: ', bnToNumber(totalBalance));
    console.log();

    for (let token of rmTokens) {
        //if (!tokenNames[token]) continue;

        console.log('token: ', token, '   ', tokenNames[token.toLowerCase()]);
        const balance = await (basketManager as BasketManagerInstance).getBalanceInMasset(fake.address, token);
        const targetWeight = await (rewardManager as RewardManagerInstance).getTargetWeight(token);
        console.log(
            'balance: ', bnToNumber(balance),
            '   weight: ', bnPerc(balance, totalBalance),
            '   target: ', bnPerc(targetWeight, ONE)
        );
        console.log();
    }

    const factor = await (rewardManager as RewardManagerInstance).getFactor();
    console.log('factor: ', bnToNumber(factor));

    const globalMaxPenaltyPerc = await (rewardManager as RewardManagerInstance).getGlobalMaxPenaltyPerc();
    console.log('globalMaxPenaltyPerc: ', bnPerc(globalMaxPenaltyPerc, ONE.mul(PERC_FACTOR)));

    const globalMaxRewardPerc = await (rewardManager as RewardManagerInstance).getGlobalMaxRewardPerc();
    console.log('globalMaxRewardPerc: ', bnPerc(globalMaxRewardPerc, ONE.mul(PERC_FACTOR)));

    async function simulateDeposit(tokenSymbol: string, sum: number) {
        const bnSum = new BN(sum).mul(ONE);
        console.log('Simulating deposit of token: ', tokenSymbol, '   sum: ', bnToNumber(bnSum));
        const tokenAddress = tokens[tokenSymbol];
        try {
            const reward = await (rewardManager as RewardManagerInstance).getRewardForDeposit(tokenAddress, bnSum, false);
            console.log('Reward: ', bnToNumber(reward));
        } catch (e) {
            console.error(e);
        }
    }

    async function simulateWithdrawal(tokenSymbol: string, sum: number) {
        const bnSum = new BN(sum).mul(ONE);
        console.log('Simulating withdrawal of token: ', tokenSymbol, '   sum: ', bnToNumber(bnSum));
        const tokenAddress = tokens[tokenSymbol];
        try {
            const reward = await (rewardManager as RewardManagerInstance).getPenaltyForWithdrawal(tokenAddress, bnSum);
            console.log('Penalty: ', bnToNumber(reward));
        } catch (e) {
            console.error(e);
        }
    }

    //await simulateWithdrawal('TST6', 100);
    //await simulateDeposit('DOC', 10000);

}

