import HDWalletProvider from '@truffle/hdwallet-provider';
import state from '../../migrations/state';
import BN from "bn.js";
import { MultiSigWalletInstance } from 'types/generated';

export default async function mint(truffle): Promise<any> {

    const artifacts = truffle.artifacts;
    const provider = truffle.web3.currentProvider;
    const network = truffle.artifacts.options.network;
    state.setNetwork(network);

    console.log(provider.getAddress(0), provider.getAddress(1));

    const Masset = artifacts.require("Masset");
    const masset = await Masset.at('0x1440d19436bEeaF8517896bffB957a88EC95a00F');

    const MultiSigWallet = artifacts.require("MultiSigWallet");
    const multiSigWallet: MultiSigWalletInstance = await state.getDeployed(MultiSigWallet, 'MultiSigWallet');

    const owners = await multiSigWallet.getOwners();
    console.log(owners);

    console.log('multiSigWallet: ', multiSigWallet['address']);

    console.log('owner before: ', await masset.owner());
    await masset.transferOwnership(multiSigWallet['address']);
    console.log('owner after: ', await masset.owner());
}

