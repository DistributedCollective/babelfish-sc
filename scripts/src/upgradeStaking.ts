import HDWalletProvider from '@truffle/hdwallet-provider';
import state from '../../migrations/state';
import BN from "bn.js";

export default async function upgradeStaking(truffle): Promise<any> {

    const artifacts = truffle.artifacts;
    const provider = truffle.web3.currentProvider;
    const admin = provider.getAddress(1);

    console.log(provider.getAddress(0), provider.getAddress(1));

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

