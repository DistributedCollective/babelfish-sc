import state from '../../migrations/state';
import { BasketManagerInstance, MassetInstance, MassetProxyInstance, MultiSigWalletInstance } from 'types/generated';
import { knownBridges, knownFactors, knownTokens } from './knownTokens';
import { ZERO_ADDRESS } from '@utils/constants';

export default async function getMultisigInfo(truffle): Promise<any> {

    const artifacts = truffle.artifacts;
    const provider = truffle.web3.currentProvider;
    const network = truffle.artifacts.options.network;
    state.setNetwork(network);

    console.log(provider.getAddress(0), provider.getAddress(1));

    const Masset = artifacts.require("Masset");
    const fake = await state.getDeployed(Masset, 'MassetProxy');

    const version = await (fake as MassetInstance).getVersion();
    console.log('version: ', version);

    const basketManager = await (fake as MassetInstance).getBasketManager();
    console.log('basketManager: ', basketManager);

    const pauseManager = await (fake as MassetInstance).getPauseManager();
    console.log('pauseManager: ', pauseManager);

    const rewardManager = await (fake as MassetInstance).getRewardManager();
    console.log('rewardManager: ', rewardManager);

    const bonusManager = await (fake as MassetInstance).getBonusManager();
    console.log('bonusManager: ', bonusManager);

    const token = await (fake as MassetInstance).getToken();
    console.log('token: ', token);
}

