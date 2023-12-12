import HDWalletProvider from '@truffle/hdwallet-provider';
import state from '../../migrations/state';
import BN from "bn.js";
import { BasketManagerInstance, MassetInstance, RewardManagerInstance } from 'types/generated';
import { ConsoleLogger } from 'ts-generator/dist/logger';
import { first } from 'lodash';

export default async function test(truffle): Promise<any> {

    const artifacts = truffle.artifacts;
    const provider = truffle.web3.currentProvider;
    const admin = provider.getAddress(1);
    const network = truffle.artifacts.options.network;
    state.setNetwork(network);

    console.log(provider.getAddress(0), provider.getAddress(1));

    const RewardManager = artifacts.require("RewardManager");
    const rewardManager = await state.getDeployed(RewardManager, 'RewardManager');

    await (rewardManager as RewardManagerInstance).setFactor(
        new BN('1000000000000000000').mul(new BN(1000)));

    const Masset = artifacts.require("Masset");
    const fake = await state.getDeployed(Masset, 'MassetProxy');

    /*
    const basketManagerAddress = await (fake as MassetInstance).getBasketManager();
    const BasketManager = artifacts.require("BasketManager");
    const basketManager = await BasketManager.at(basketManagerAddress);
    const basketManagerVersion = await (basketManager as BasketManagerInstance).getVersion();
    console.log('basketManagerVersion', basketManagerVersion);
    */
    /*
    for(let basset of bassets) {
        const balance = await (basketManager as BasketManagerInstance).getBalanceInMasset(fake.address, basset);
        console.log(basset, balance.div(new BN('10000000000')).toNumber()/100000000);
    }
    */

    const result = await (rewardManager as RewardManagerInstance).getPenaltyForWithdrawal('0x4d5A316d23EBe168D8f887b4447BF8DBfA4901cc', 
    new BN('1000000000000000000').mul(new BN(50000)));
    console.log(result.div(new BN('1000000000000')).toNumber()/1000000);



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
    '0x0188F7676eC4956aDbEa415D38ce7Af45d4721bd' // MOCK
];