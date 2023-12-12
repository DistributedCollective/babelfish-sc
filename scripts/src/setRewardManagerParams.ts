import state from '../../migrations/state';
import BN from "bn.js";
import { RewardManagerInstance } from 'types/generated/RewardManager';
import { knownTokens } from './knownTokens';

const ONE = new BN('1000000000000000000');

const tokenTargetWeights = {
    rsk: {
        'DAIES': 0.05,
        'USDCES': 0.05,
        'USDTES': 0.05,
        'DAIBS': 0.05,
        'USDCBS': 0.05,
        'USDTBS': 0.15,
        'BUSDBS': 0.05,
        'RUSDT': 0.05,
        'RDOC': 0.005,
        'DOC': 0.005,
        'DLLR': 0.49
    },
    rskTestnet: {
        'SEPUSDES': 0.05,
        'tDOC': .005,
        'tRDOC': .005,
        'trUSDT': .05,
        'DLLR': .20,
        'TST1': .05,
        'TST2': .05,
        'TST3': .05,
        'TST4': .05,
        'TST6': .49
    }
};

export default async function setParams(truffle): Promise<any> {

    const artifacts = truffle.artifacts;
    const provider = truffle.web3.currentProvider;
    const network = truffle.artifacts.options.network;
    state.setNetwork(network);

    console.log(provider.getAddress(0), provider.getAddress(1));

    const tokens = knownTokens[network];

    const targetWeights = tokenTargetWeights[network];
    let tokenNames = Object.keys(targetWeights);

    /*
    const Masset = artifacts.require("Masset");
    const fake = await state.getDeployed(Masset, 'MassetProxy');
    const rewardManagerAddress = await (fake as MassetInstance).getRewardManager();
    console.log('rewardManagerAddress', rewardManagerAddress);
    */

    const RewardManager = artifacts.require("RewardManager");
    //const rewardManager = await state.getDeployed(RewardManager, 'RewardManager');
    const rewardManager = await RewardManager.at('0xdfE234575c04F8Ad29Bea2c1546799e677022021');

    if (network == 'rskTestnet') {

        console.log('setting target weights: ');
        for(const token of tokenNames) {
            console.log('token ', token, '   weight: ', targetWeights[token].toString());
        }
        const addresses = tokenNames.map(tn => tokens[tn]);

        let total = new BN(0);
        const weights = [];
        tokenNames.forEach(tn => {
            const weight = new BN(1000000 * targetWeights[tn]).mul(new BN(1000000000000));
            total = total.add(weight);
            weights.push(weight);
        });
        console.log('Total weights: ', total.toString());

        await (rewardManager as RewardManagerInstance).setTargetWeights(addresses, weights);

        const factor = 2000000;
        console.log('setting factor to: ', factor);
        await (rewardManager as RewardManagerInstance).setFactor(ONE.mul(new BN(factor)));

        const maxPenalty = 100;
        const maxReward = 25;
        const TENTH = new BN('100000000000000000');
        console.log('setting max incentives to: maxReward: ', maxReward, '    maxPenalty: ', maxPenalty);
        await (rewardManager as RewardManagerInstance).setGlobalMaxRewardPerc(TENTH.mul(new BN(maxReward)));
        await (rewardManager as RewardManagerInstance).setGlobalMaxPenaltyPerc(TENTH.mul(new BN(maxPenalty)));

    } else if(network == 'rsk') {

        console.log('setting target weights: ');
        for(const token of tokenNames) {
            console.log('token ', token, '   weight: ', targetWeights[token].toString());
        }
        const addresses = tokenNames.map(tn => tokens[tn]);

        let total = new BN(0);
        const weights = [];
        tokenNames.forEach(tn => {
            const weight = new BN(1000000 * targetWeights[tn]).mul(new BN(1000000000000));
            total = total.add(weight);
            weights.push(weight);
        });
        console.log('Total weights: ', total.toString());
        //await (rewardManager as RewardManagerInstance).setTargetWeights(addresses, weights);

        const factor = 2000000;
        console.log('setting factor to: ', factor);
        //await (rewardManager as RewardManagerInstance).setFactor(ONE.mul(new BN(factor)));

        const maxReward = 25;
        const maxPenalty = 100;
        const TENTH = new BN('100000000000000000');
        console.log('setting max incentives to: maxReward: ', maxReward, '    maxPenalty: ', maxPenalty);
        //await (rewardManager as RewardManagerInstance).setGlobalMaxRewardPerc(TENTH.mul(new BN(maxReward)));
        console.log('*');
        await (rewardManager as RewardManagerInstance).setGlobalMaxPenaltyPerc(TENTH.mul(new BN(maxPenalty)));
    }
}
