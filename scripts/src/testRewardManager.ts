import HDWalletProvider from '@truffle/hdwallet-provider';
import state from '../../migrations/state';
import BN from "bn.js";
import { BasketManagerInstance, MassetInstance, MassetProxyInstance } from 'types/generated';
import { RewardManagerInstance } from 'types/generated/RewardManager';

const ONE = new BN('1000000000000000000');

export default async function mint(truffle): Promise<any> {

    const artifacts = truffle.artifacts;
    const provider = truffle.web3.currentProvider;
    const network = truffle.artifacts.options.network;
    state.setNetwork(network);

    console.log(provider.getAddress(0), provider.getAddress(1));

    /*
    const Masset = artifacts.require("Masset");
    const MassetProxy = artifacts.require("MassetProxy");
    const BasketManager = artifacts.require("BasketManager");

    const massetProxy = await state.getDeployed(MassetProxy, 'MassetProxy');
    const masset = await Masset.at(massetProxy.address);
    const basketManagerAddress = await (masset as MassetInstance).getBasketManager();
    console.log('basketManagerAddress', basketManagerAddress);
    const basketManager = await BasketManager.at(basketManagerAddress);
    const bassets = await (basketManager as BasketManagerInstance).getBassets();
    console.log(bassets);
    return;
    */

    const RewardManager = artifacts.require("RewardManager");
    const rewardManager = await state.getDeployed(RewardManager, 'RewardManager');
    await (rewardManager as RewardManagerInstance).setFactor(ONE.mul(new BN('1')));
    const bnWeights = weights.map(w => new BN(w));
    await (rewardManager as RewardManagerInstance).setTargetWeights(bassets, bnWeights);
    const amount = ONE.mul(new BN('1500'));
    const r = await (rewardManager as RewardManagerInstance).getPenaltyForWithdrawal(bassets[7], amount);
    const perc = r.mul(new BN('10000000000')).div(amount).toNumber()/100000000;
    console.log(r.toString(), perc);
}

const bassets = [
    '0x30199Fc1322B89bBe8b575BA4f695632961FC8f3', // SEPUSDes
    '0x407Ff7D4760d3a81b4740D268eb04490C7dFE7f2', // bsDAI
    '0x3e2cf87e7fF4048A57F9Cdde9368C9f4bfb43aDf', // bsUSDC
    '0x43bC3f0FfFf6c9BBf3C2EAfe464C314d43f561De', // bsUSDT
    '0x8c9abb6c9D8D15ddB7ada2e50086e1050aB32688', // bsBUSD
    '0x4d5A316d23EBe168D8f887b4447BF8DBfA4901cc', // RUSDT
    '0xC3De9F38581f83e281f260d0DdbaAc0e102ff9F8', // rDOC
    '0xCB46c0ddc60D18eFEB0E586C17Af6ea36452Dae0', // DOC
    '0x6b41566353d6C7B8C2a7931d498F11489DacAc29', // zUSD
    '0x0188F7676eC4956aDbEa415D38ce7Af45d4721bd', // MOCK
    '0x007b3AA69A846cB1f76b60b3088230A52D2A83AC', // DLLR
];

const weights = [
    '0',
    '0',
    '0',
    '0',
    '0',
    '0',
    '0',
    '1000000000000000000',
    '0',
    '0',
    '0'
];
