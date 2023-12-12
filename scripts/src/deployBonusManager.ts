import HDWalletProvider from '@truffle/hdwallet-provider';
import state from '../../migrations/state';
import BN from "bn.js";
import { BasketManagerInstance, MassetInstance, MassetProxyInstance } from 'types/generated';
import { RewardManagerInstance } from 'types/generated/RewardManager';

export default async function deployBonusManager(truffle): Promise<any> {

    const artifacts = truffle.artifacts;
    const provider = truffle.web3.currentProvider;
    const network = truffle.artifacts.options.network;
    state.setNetwork(network);

    console.log(provider.getAddress(0), provider.getAddress(1));
    const admin = provider.getAddress(1);

    const MassetProxy = artifacts.require("MassetProxy");
    const BonusManager = artifacts.require("BonusManager");

    const massetProxy = await state.getDeployed(MassetProxy, 'MassetProxy');

    const bonusManager = await state.conditionalDeploy(BonusManager, 'BonusManager', () => {
        return BonusManager.new(massetProxy.address);
    });

    
}
