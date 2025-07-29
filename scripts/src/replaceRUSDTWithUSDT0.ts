import HDWalletProvider from '@truffle/hdwallet-provider';
import state from '../../migrations/state';
import BN from "bn.js";
import { BasketManagerInstance, MassetInstance, MultiSigWalletInstance } from 'types/generated';
import { ZERO_ADDRESS } from '@utils/constants';
import { knownTokens } from './knownTokens';

export default async function mint(truffle): Promise<any> {
    const artifacts = truffle.artifacts;
    const provider = truffle.web3.currentProvider;
    const network = truffle.artifacts.options.network;
    state.setNetwork(network);

    console.log(provider.getAddress(0), provider.getAddress(1));

    const Masset = artifacts.require("Masset");
    const fake = await state.getDeployed(Masset, 'MassetProxy');

    console.log('version before: ', await fake.getVersion());

    const bmAddress = await (fake as MassetInstance).getBasketManager();
    console.log('bmAddress', bmAddress);

    const BasketManager = artifacts.require("BasketManager");
    const basketManager = await BasketManager.at(bmAddress);
    const bmVersion = await basketManager.getVersion();

    console.log('bmVersion', bmVersion);

    let bassets = await (basketManager as BasketManagerInstance).getBassets();
    console.log('bassets', bassets);

    // remove RUSDT from basket
    await (basketManager as BasketManagerInstance).removeBasset(knownTokens[network]['RUSDT']);

    // add USDT0 to basket
    await (basketManager as BasketManagerInstance).addBasset(knownTokens[network]['USDT0'], 1, ZERO_ADDRESS);

    bassets = await (basketManager as BasketManagerInstance).getBassets();
    console.log('bassets', bassets);
}

