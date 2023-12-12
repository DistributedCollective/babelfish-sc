import HDWalletProvider from '@truffle/hdwallet-provider';
import state from '../../migrations/state';
import BN from "bn.js";

export default async function upgradeStaking(truffle): Promise<any> {

    const artifacts = truffle.artifacts;
    const provider = truffle.web3.currentProvider;
    const admin = provider.getAddress(1);
    const network = truffle.artifacts.options.network;
    state.setNetwork(network);

    console.log(provider.getAddress(0), provider.getAddress(1));

    const stakingAddress = '0xFd8ea2e5e8591fA791d44731499cDF2e81CD6a41';

    const Staking = artifacts.require("Staking");
    const staking = await state.conditionalDeploy(Staking, 'Staking', () => Staking.new());

    const StakingProxy = artifacts.require("StakingProxy");
    const stakingProxy = await state.getDeployed(StakingProxy, 'StakingProxy');

    stakingProxy.setImplementation(staking.address);

    console.log('New staking: ' + staking.address);
    const abi = stakingProxy.contract.methods['upgradeTo(address)'](staking.address).encodeABI();
    console.log(abi);
    return;
}

