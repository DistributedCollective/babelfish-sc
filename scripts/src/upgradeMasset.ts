import HDWalletProvider from '@truffle/hdwallet-provider';
import state from '../../migrations/state';
import BN from "bn.js";
import { BasketManagerInstance, MassetInstance, MassetProxyInstance } from 'types/generated';
import { RewardManagerInstance } from 'types/generated/RewardManager';

export default async function upgradeMasset(truffle): Promise<any> {

    const artifacts = truffle.artifacts;
    const provider = truffle.web3.currentProvider;
    const network = truffle.artifacts.options.network;
    state.setNetwork(network);

    console.log(provider.getAddress(0), provider.getAddress(1));
    const admin = provider.getAddress(1);

    const Masset = artifacts.require("Masset");
    const fake = await state.getDeployed(Masset, 'MassetProxy');

    const RewardManager = artifacts.require("RewardManager");
    const BonusManager = artifacts.require("BonusManager");

    const MassetProxy = artifacts.require("MassetProxy");
    const massetProxy = await state.getDeployed(MassetProxy, 'MassetProxy');

    let newMasset;

    console.log('STEP 1: deploy Masset if needed...');
    {
        const version = await (fake as MassetInstance).getVersion();
        console.log('Current Masset version: ', version);

        if (version != '5.2') {
            console.log('Deploying Masset...');
            newMasset = await state.forceDeploy(Masset, 'Masset', () => Masset.new());
            console.log('New Masset: ', newMasset.address);
        } else {
            console.log('No change');
            return;
        }
    }
    console.log('Done.');

    if (network == 'rskTestnet') {

        console.log('STEP 2: upgrade...');
        {
            console.log('Upgrading...');
            await (massetProxy as MassetProxyInstance).upgradeTo(newMasset.address, { from: admin });

            console.log('Migrating....');
            await (fake as MassetInstance).migrateToV5();
        }
        console.log('Done.');

    } else {

        console.log('STEP 2: upgrade in proxy...');
        {
            const abi = massetProxy.contract.methods['upgradeTo(address)'](newMasset.address).encodeABI();
            console.log(`Send to: ${massetProxy.address},    ABI: ${abi}`);
        }

        console.log('STEP 3: migrate...');
        {
            try {
                await (fake as MassetInstance).migrateToV5();        
            } catch(e) {
                console.error(e);
                console.log('Migration failed. Do the upgrade in the MS first.');
                return;
            }
        }
        console.log('Done.');
    }

    const version = await (fake as MassetInstance).getVersion();
    console.log('Current Masset version: ', version);
}
