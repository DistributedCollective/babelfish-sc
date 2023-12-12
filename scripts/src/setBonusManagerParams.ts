import state from '../../migrations/state';
import BN from "bn.js";
import { RewardManagerInstance } from 'types/generated/RewardManager';
import { knownTokens } from './knownTokens';
import { BonusManagerInstance, MassetInstance } from 'types/generated';

const ONE = new BN('1000000000000000000');

export default async function setParams(truffle): Promise<any> {

    const artifacts = truffle.artifacts;
    const provider = truffle.web3.currentProvider;
    const network = truffle.artifacts.options.network;
    state.setNetwork(network);

    console.log(provider.getAddress(0), provider.getAddress(1));

    const tokens = knownTokens[network];

    const Masset = artifacts.require("Masset");
    const fake = await state.getDeployed(Masset, 'MassetProxy');
    const bonusManagerAddress = await (fake as MassetInstance).getRewardManager();
    console.log('bonusManagerAddress', bonusManagerAddress);

    const BonusManager = artifacts.require("BonusManager");
    const bonusManager = await state.getDeployed(BonusManager, 'BonusManager');

    if (network == 'rskTestnet') {

        //await (bonusManager as BonusManagerInstance).setTokens([ tokens.TST1, tokens.TST2, tokens.TST3 ]);
        //await (bonusManager as BonusManagerInstance).setRewardMultiplier(ONE);
        //await (bonusManager as BonusManagerInstance).setMinimumAmount(ONE.mul(new BN(10)));
        //await (bonusManager as BonusManagerInstance).setMaximumBonus(ONE.mul(new BN(100)));

        const bonus = await (bonusManager as BonusManagerInstance).getPredictedBonus(tokens.TST2, new BN(100).mul(ONE));
        console.log(bonus.toString());

    } else if(network == 'rsk') {
    }
}
