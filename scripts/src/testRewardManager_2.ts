import HDWalletProvider from '@truffle/hdwallet-provider';
import state from '../../migrations/state';
import BN from "bn.js";
import { BasketManagerInstance, ERC20Instance, MassetInstance, MassetProxyInstance } from 'types/generated';
import { RewardManagerInstance } from 'types/generated/RewardManager';

const ONE = new BN('1000000000000000000');
const dllrAddress = '0x007b3AA69A846cB1f76b60b3088230A52D2A83AC';
const xusdAddress = '0xa9262CC3fB54Ea55B1B0af00EfCa9416B8d59570';

export default async function mint(truffle): Promise<any> {

    const artifacts = truffle.artifacts;
    const provider = truffle.web3.currentProvider;
    const network = truffle.artifacts.options.network;
    state.setNetwork(network);

    console.log(provider.getAddress(0), provider.getAddress(1));

    const ERC20 = artifacts.require("IERC20");
    const xusd = await ERC20.at(xusdAddress);
    const dllr = await ERC20.at(dllrAddress);

    const Masset = artifacts.require("Masset");
    const MassetProxy = artifacts.require("MassetProxy");
    const massetProxy = await state.getDeployed(MassetProxy, 'MassetProxy');
    const fakeMasset = await Masset.at(massetProxy.address);
    const RewardManager = artifacts.require("RewardManager");
    const rewardManagerAddress = await (fakeMasset as MassetInstance).getRewardManager();
    const rewardManager = RewardManager.at(rewardManagerAddress);

    console.log(1);
    await (dllr as ERC20Instance).approve(massetProxy.address, new BN(1000).mul(ONE));
    console.log(2);
    await (xusd as ERC20Instance).approve(massetProxy.address, new BN(1000).mul(ONE));
    console.log(3);

    // {
    //     const amountBN = new BN(300).mul(ONE);
    //     await (fakeMasset as MassetInstance).redeemWithMaximumPenalty(dllrAddress, amountBN, amountBN);
    // }
    //await (fakeMasset as MassetInstance).redeemWithMaximumPenalty(dllrAddress, new BN(300).mul(ONE), new BN(300).mul(ONE));

    async function mint(amount: number) {
        console.log('minting, amount: ', amount);
        const amountBN = new BN(amount).mul(ONE);
        const before = await (xusd as ERC20Instance).balanceOf(provider.getAddress(0));
        await (fakeMasset as MassetInstance).mintWithMinimumReward(dllrAddress, amountBN, '0');
        const after = await (xusd as ERC20Instance).balanceOf(provider.getAddress(0));
        console.log('before', before.toString(), 'after', after.toString(), 'sum', after.sub(before).div(new BN('10000000000')).toNumber()/100000000);
    }

    await mint(50);

    console.log('removing 50...');
    const amountBN = new BN(50).mul(ONE);
    await (fakeMasset as MassetInstance).redeemWithMaximumPenalty(dllrAddress, amountBN, amountBN);

    await mint(10);
    await mint(10);
    await mint(10);
    await mint(10);
    await mint(10);
    

}


