import HDWalletProvider from '@truffle/hdwallet-provider';
import state from '../../migrations/state';
import BN from "bn.js";
import { MassetInstance, MultiSigWalletInstance, PauseManagerInstance } from 'types/generated';
import { knownTokens, knownTokensAddressToName } from './knownTokens';

export default async function pauseInfo(truffle): Promise<any> {

    const artifacts = truffle.artifacts;
    const provider = truffle.web3.currentProvider;
    const admin = provider.getAddress(1);
    const network = truffle.artifacts.options.network;
    state.setNetwork(network);
    console.log(provider.getAddress(0), provider.getAddress(1));

    const Masset = artifacts.require("Masset");
    const fake = await state.getDeployed(Masset, 'MassetProxy');

    const PauseManager = artifacts.require("PauseManager");
    const pmAddress = await (fake as MassetInstance).getPauseManager();
    const pm = await PauseManager.at(pmAddress);

    console.log('pausemanager', pmAddress);

    //const MultisigWallet = artifacts.require("MultisigWallet");
    //const ms = await MultisigWallet.at('0xbd687d470a7e8b36c666968bb79376904725e4dd');
    //console.log('owners', await (ms as MultiSigWalletInstance).getOwners());
    //console.log('required', await (ms as MultiSigWalletInstance).required());

    const owner = await (pm as PauseManagerInstance).owner();
    console.log('owner', owner);

    const pausers = await (pm as PauseManagerInstance).getPausers();
    console.log('pausers', pausers);

    const tokens = await (pm as PauseManagerInstance).getTokens();
    for (let t of tokens) {
        const f1 = await (pm as PauseManagerInstance).isPaused(t);
        const name = knownTokensAddressToName[network][t];
        console.log(`name: ${name}   address: ${t} is ${f1 ? 'paused' : 'not paused'}`);
        //await (pm as PauseManagerInstance).unpause(t);
        //const f2 = await (pm as PauseManagerInstance).isPaused(t);
        //console.log('after token ', t, f2);
        //const abi = pm.contract.methods['unpause(address)'](t).encodeABI();
        //console.log(abi);
    }

    const pt = ['0xC3De9F38581f83e281f260d0DdbaAc0e102ff9F8',
        '0xCB46c0ddc60D18eFEB0E586C17Af6ea36452Dae0',
        '0x407Ff7D4760d3a81b4740D268eb04490C7dFE7f2',
        '0x8c9abb6c9D8D15ddB7ada2e50086e1050aB32688',
        '0x3e2cf87e7fF4048A57F9Cdde9368C9f4bfb43aDf'];
    for(let t of pt) {
        await (pm as PauseManagerInstance).unpause(t);
    }
}
