import HDWalletProvider from '@truffle/hdwallet-provider';
import state from '../../migrations/state';
import BN from "bn.js";
import { BasketManagerInstance, MassetInstance } from 'types/generated';
import { knownTokens } from './knownTokens';

export default async function mint(truffle): Promise<any> {

    const artifacts = truffle.artifacts;
    const provider = truffle.web3.currentProvider;
    const admin = provider.getAddress(1);
    const network = truffle.artifacts.options.network;
    state.setNetwork(network);

    console.log(provider.getAddress(0), provider.getAddress(1));

    const addressToName = {};
    Object.keys(knownTokens[network]).forEach(name => addressToName[knownTokens[network][name]] = name);
    
    const Masset = artifacts.require("Masset");
    const fake = await state.getDeployed(Masset, 'MassetProxy');
    const basketManagerAddress = await (fake as MassetInstance).getBasketManager();
    console.log('basketManagerAddress: ', basketManagerAddress);

    const BasketManager = artifacts.require("BasketManager");
    const basketManager = await BasketManager.at(basketManagerAddress);

    const bmVersion = await (basketManager as BasketManagerInstance).getVersion();
    console.log('bmVersion', bmVersion);

    const bassets = await (basketManager as BasketManagerInstance).getBassets();
    
    for(const token of bassets) {
        const bridge = await (basketManager as BasketManagerInstance).getBridge(token);
        const factor = await (basketManager as BasketManagerInstance).getFactor(token);
        console.log(`sumbol: ${addressToName[token] ?? '???'}   token: ${token}   factor: ${factor}   bridge: ${bridge}`);
    }
}
