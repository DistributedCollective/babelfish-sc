import HDWalletProvider from '@truffle/hdwallet-provider';
import state from '../../migrations/state';
import BN from "bn.js";
import { MassetInstance, MultiSigWalletInstance, PauseManagerInstance } from 'types/generated';
import { knownTokens, knownTokensAddressToName } from './knownTokens';

export default async function pauseInfo(truffle): Promise<any> {

    const provider = truffle.web3.currentProvider;

    for(let i=0; i<20; i++) {
        console.log(provider.getAddress(i));
    }
    
}
