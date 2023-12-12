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

    const MultiSigWallet = artifacts.require("MultiSigWallet");
    const multiSigWallet = await MultiSigWallet.at('0x37a706259f5201c03f6cb556a960f30f86842d01'); // sale ms

    const newTyrone = '0xFEe171A152C02F336021fb9E79b4fAc2304a9E7E';

    const abi = multiSigWallet.contract.methods['addOwner(address)'](newTyrone).encodeABI();
    console.log('abi: ', abi);
    

    //await (multiSigWallet as MultiSigWalletInstance).submitTransaction(multiSigWallet.address, 0, abi1);
    //await (multiSigWallet as MultiSigWalletInstance).submitTransaction(multiSigWallet.address, 0, abi2);

}
