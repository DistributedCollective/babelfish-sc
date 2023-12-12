import state from '../../migrations/state';
import { BasketManagerInstance, MassetInstance, MassetProxyInstance, MultiSigWalletInstance } from 'types/generated';
import { knownBridges, knownFactors, knownTokens } from './knownTokens';
import { ZERO_ADDRESS } from '@utils/constants';
import BN from "bn.js";

export default async function getMultisigInfo(truffle): Promise<any> {

    const artifacts = truffle.artifacts;
    const provider = truffle.web3.currentProvider;
    const network = truffle.artifacts.options.network;
    state.setNetwork(network);

    console.log(provider.getAddress(0), provider.getAddress(1));

    const MultiSigWallet = artifacts.require("MultiSigWallet");
    let ms = await MultiSigWallet.at('0xbD687d470A7E8B36C666968bb79376904725E4DD');

    const abi1 = ms.contract.methods['changeRequirement(uint256)'](2).encodeABI();
    console.log(`Send to ${ms.address},    ABI: ${abi1}`);

    const owners = await (ms as MultiSigWalletInstance).getOwners();
    console.log('owners: ', owners);

    const required = await (ms as MultiSigWalletInstance).required();
    console.log('required: ', required.toNumber());

    const count = await (ms as MultiSigWalletInstance).getTransactionCount(true, true);
    const ids = (await (ms as MultiSigWalletInstance).getTransactionIds(32, 36, true, true)).map(id => id.toString());
    console.log('ids: ', ids);
    for(const id of ids) {
        const t = await (ms as MultiSigWalletInstance).getConfirmations(id);
        console.log(`id: ${id}, t: ${t}`);
    }
}
