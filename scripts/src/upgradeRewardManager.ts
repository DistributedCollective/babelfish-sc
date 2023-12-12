import state from '../../migrations/state';
import { MassetInstance } from 'types/generated';
import { RewardManagerInstance } from 'types/generated/RewardManager';
import { knownBridges, knownFactors, knownTokens } from './knownTokens';

export default async function upgradeRewardManager(truffle): Promise<any> {

    const artifacts = truffle.artifacts;
    const provider = truffle.web3.currentProvider;
    const network = truffle.artifacts.options.network;
    state.setNetwork(network);

    console.log(provider.getAddress(0), provider.getAddress(1));

    const Masset = artifacts.require("Masset");
    let fake = await state.getDeployed(Masset, 'MassetProxy');

    const MassetProxy = artifacts.require("MassetProxy");
    let massetProxy = await state.getDeployed(MassetProxy, 'MassetProxy');

    const RewardManager = artifacts.require("RewardManager");

    let rewardManager;

    console.log('STEP 1: deploy new reward manager...');
    {
        // const rewardManagerAddress = await (fake as MassetInstance).getRewardManager();
        // rewardManager = await RewardManager.at(rewardManagerAddress);
        // const version = await (rewardManager as RewardManagerInstance).getVersion();
        // console.log('Current reward manager: ', rewardManager.address);
        // console.log('Current version: ', version);
        // if (version != "3.0") {
        //     rewardManager = await state.forceDeploy(RewardManager, 'RewardManager',
        //         () => RewardManager.new(fake.address));
        //     const version = await (rewardManager as RewardManagerInstance).getVersion();
        //     console.log('New reward manager: ', rewardManager.address);
        //     console.log('New version: ', version);
        // }
    }
    console.log('Done.');

    console.log('STEP 2: Run set params...');
    {
        // const tokens = await (rewardManager as RewardManagerInstance).getTokens();
        // if (tokens.length == 0) {
        //     console.log('Go do it....');
        //     return;
        // }
    }
    console.log('Done.');

    if (network == 'rskTestnet') {

        console.log('STEP 3: set reward manager in Masset...');
        {
            const oldRewardManager = await (fake as MassetInstance).getRewardManager();
            console.log('Old reward manager: ', oldRewardManager);
            if (oldRewardManager != rewardManager.address) {
                console.log('Setting....');
                await (fake as MassetInstance).setRewardManager(rewardManager.address);
                const newRewardManager = await (fake as MassetInstance).getRewardManager();
                console.log('New reward manager: ', newRewardManager);
            } else {
                console.log('No change');
            }
        }
        console.log('Done.');

    } else if (network == 'rsk') {

        // const multiSig = '0x37a706259f5201c03f6cb556a960f30f86842d01';

        // console.log('STEP 3: set reward manager owner...');
        // {
        //     const owner = await (rewardManager as RewardManagerInstance).owner();
        //     console.log('Current owner: ', owner);
        //     if (multiSig.toLocaleLowerCase() != owner.toLocaleLowerCase()) {
        //         console.log('Setting....');
        //         await (rewardManager as RewardManagerInstance).transferOwnership(multiSig);
        //         const owner = await (rewardManager as RewardManagerInstance).owner();
        //         console.log('New owner: ', owner);
        //     } else {
        //         console.log('No change');
        //     }
        // }
        // console.log('Done.');

        console.log('STEP 4: set reward manager in Masset...');
        {
            const rewardManagerAddress = '0xdfE234575c04F8Ad29Bea2c1546799e677022021';
            const abi = fake.contract.methods['setRewardManager(address)'](rewardManagerAddress).encodeABI();
            console.log(`Send to ${fake.address},    ABI: ${abi}`);
        }
        console.log('Done.');
    }
}
