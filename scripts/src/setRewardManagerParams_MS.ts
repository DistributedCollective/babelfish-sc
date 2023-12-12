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
        'ZUSD': 0.49
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
    const rewardManager = await state.getDeployed(RewardManager, 'RewardManager');

    /*
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
    */

    console.log(`Send to ${rewardManager.address}`);

    const maxReward = 25;
    const maxPenalty = 100;
    const TENTH = new BN('100000000000000000');
    console.log('setting max incentives to: maxReward: ', maxReward, '    maxPenalty: ', maxPenalty);
    //await (rewardManager as RewardManagerInstance).setGlobalMaxRewardPerc(TENTH.mul(new BN(maxReward)));
    {
        const abi = rewardManager.contract.methods['setGlobalMaxRewardPerc(uint256)'](TENTH.mul(new BN(maxReward)).toString()).encodeABI();
        console.log(`setGlobalMaxRewardPerc(${TENTH.mul(new BN(maxReward)).toString()})`)
        console.log('Payload: ', abi);
    }

    //await (rewardManager as RewardManagerInstance).setGlobalMaxPenaltyPerc(TENTH.mul(new BN(maxPenalty)));
    {
        const abi = rewardManager.contract.methods['setGlobalMaxPenaltyPerc(uint256)'](TENTH.mul(new BN(maxPenalty)).toString()).encodeABI();
        console.log(`setGlobalMaxPenaltyPerc(${TENTH.mul(new BN(maxPenalty)).toString()})`)
        console.log('Payload: ', abi);
    }

    const factor = 2000000;
    console.log('setting factor to: ', factor);
    //await (rewardManager as RewardManagerInstance).setFactor(ONE.mul(new BN(factor)));
    {
        const abi = rewardManager.contract.methods['setFactor(uint256)'](ONE.mul(new BN(factor)).toString()).encodeABI();
        console.log(`setFactor(${ONE.mul(new BN(factor)).toString()})`)
        console.log('Payload: ', abi);
    }
}
