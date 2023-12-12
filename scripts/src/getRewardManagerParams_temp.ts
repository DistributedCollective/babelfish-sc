import HDWalletProvider from '@truffle/hdwallet-provider';
import state from '../../migrations/state';
import BN from "bn.js";
import { BasketManagerInstance, MassetInstance, MassetProxyInstance } from 'types/generated';
import { RewardManagerInstance } from 'types/generated/RewardManager';
import { ZERO_ADDRESS } from '@utils/constants';

const ONE = new BN('1000000000000000000');
const PERC_FACTOR = new BN(100);

const tokens = {
    'DAIes': '0x1a37c482465e78E6dabE1eC77b9A24d4236D2A11',
    'USDCes': '0x8D1F7cBC6391d95E2774380E80a666fEBf655d6B',
    'USDTes': '0xD9665Ea8F5Ff70CF97e1b1CD1B4Cd0317B0976e8',
    'DAIbs': '0x6A42FF12215a90F50866a5CE43a9c9c870116E76',
    'USDCbs': '0x91eDceE9567cD5612C9DeDeAAe24D5e574820Af1',
    'USDTbs': '0xFf4299bcA0313c20A61dC5Ed597739743bEf3f6D',
    'BUSDbs': '0x61e9604E31a736129D7f5c58964C75935b2D80d6',
    'RUSDT': '0xef213441A85dF4d7ACbDaE0Cf78004e1E486bB96',
    'rDOC': '0x2d919F19D4892381D58edeBeca66D5642Cef1a1f',
    'DOC': '0xe700691dA7b9851F2F35f8b8182c69c53CcaD9Db',
    'ZUSD': '0xdB107FA69E33f05180a4C2cE9c2E7CB481645C2d'
};

const tokenTargetWeights = {
    'DAIes': 0.05,
    'USDCes': 0.05,
    'USDTes': 0.05,
    'DAIbs': 0.05,
    'USDCbs': 0.05,
    'USDTbs': 0.15,
    'BUSDbs': 0.05,
    'RUSDT': 0.05,
    'rDOC': 0.005,
    'DOC': 0.005,
    'ZUSD': 0.49
};

const tokenBalances = {
    'DAIes': 0,
    'USDCes': 0,
    'USDTes': 0,
    'DAIbs': 0,
    'USDCbs': 0,
    'USDTbs': 0,
    'BUSDbs': 0,
    'RUSDT': 0,
    'rDOC': 0,
    'DOC': 0,
    'ZUSD': 3924696
};

const total = 3924903;

function dSqrFunction(weights, targets) {
    let d = 0;
    for (let i = 0; i < weights.length; i++) {
        d += (weights[i] - targets[i]) * (weights[i] - targets[i]);
    }
    return d / weights.length;
}

function vFunction(weights, targets, factor) {
    let d = dSqrFunction(weights, targets);
    return factor * d / (1 / d);
}

function getReward(balances, targets, factor, index, sum) {

    balances = balances.map(b => b);

    let weights = balances.map(b => b / total);
    const v1 = vFunction(weights, targets, factor);
    balances[index] += sum;
    weights = balances.map(b => b / total);
    const v2 = vFunction(weights, targets, factor);
    return v1 > v2 ? sum * (v1 - v2) : 0;
}

function getPenalty(balances, targets, factor, index, sum) {

    balances = balances.map(b => b);

    let weights = balances.map(b => b / total);
    const v1 = vFunction(weights, targets, factor);
    balances[index] -= sum;
    weights = balances.map(b => b / total);
    const v2 = vFunction(weights, targets, factor);
    return v2 > v1 ? sum * (v2 - v1) : 0;
}

function bnPerc(a: BN, b: BN) {
    const n = a.mul(PERC_FACTOR).mul(PERC_FACTOR).div(b).toNumber() / 100;
    return `${n}%`;
}

export default async function mint(truffle): Promise<any> {

    const artifacts = truffle.artifacts;
    const provider = truffle.web3.currentProvider;
    const network = truffle.artifacts.options.network;
    state.setNetwork(network);

    console.log(provider.getAddress(0), provider.getAddress(1));

    const tokenNames = Object.keys(tokenBalances);
    let totalWeights = 0;
    tokenNames.forEach(name => {
        totalWeights += tokenTargetWeights[name];
    });
    console.log('totalWeights: ', totalWeights);

    const balances = tokenNames.map(name => tokenBalances[name]);
    const weights = balances.map(b => b / total);
    const targets = tokenNames.map(name => tokenTargetWeights[name]);


    console.log('***********************************');

    const factor = 100000;
    const sum = 10000;

    for(let i=0; i < 11; i++) {
        const reward = getReward(balances, targets, factor, i, sum);
        console.log(`reward for depositing ${sum} ${tokenNames[i]}: `, reward, '   %: ', 100 * reward / sum);
    }

    console.log('***********************************');

    for(let i=0; i < 11; i++) {
        const penalty = getPenalty(balances, targets, factor, i, sum);
        console.log(`penalty for withdrawing ${sum} ${tokenNames[i]}: `, penalty, '   %: ', 100 * penalty / sum);
    }

    /*

    const Masset = artifacts.require("Masset");
    const fake = await state.getDeployed(Masset, 'MassetProxy');
    
    const ERC20 = artifacts.require("ERC20");

    const bton = (n) => n.div(new BN('1000000000000000000')).toNumber();

    const tokenAddresses = Object.keys(tokens);
    let total = 0;
    const balances = {};
    for(const tokenAddress of tokenAddresses) {
        const erc20 = await ERC20.at(tokenAddress);
        const symbol = tokens[tokenAddress];
        const balance = bton(await erc20.balanceOf(fake.address));
        balances[symbol] = balance;
        total += balance;
        console.log(symbol, '   tokenAddress: ', tokenAddress, '   balance: ', balance);
    }
    console.log('\n');
    console.log('\n');
    console.log('\n');
    console.log('total: ', total);
    console.log('\n');
    for(const tokenAddress of tokenAddresses) {
        const symbol = tokens[tokenAddress];
        const balance = balances[tokenAddress];
        const weight = 100 * balance / total;
        console.log(symbol, '   ', tokenAddress, '   balance: ', balance, '   weight: ', weight.toString());
    }

    const factor = 1000;

    const rewardManagerAddress = await (fake as MassetInstance).getRewardManager();
    console.log('rewardManagerAddress', rewardManagerAddress);

    const RewardManager = artifacts.require("RewardManager");
    const rewardManager = await RewardManager.at(rewardManagerAddress);

    const rmTokens = await (rewardManager as RewardManagerInstance).getTokens();
    console.log('rmTokens: ', rmTokens);

    const totalBalance = await (basketManager as BasketManagerInstance).getTotalBalanceInMasset(fake.address);
    console.log('totalBalance: ', totalBalance.toString());

    console.log('token weights:');
    for(let token of rmTokens) {
        if(!tokenNames[token.toLocaleLowerCase()]) continue;

        console.log('token: ', token, '   ', tokenNames[token.toLocaleLowerCase()] ?? '');
        const balance = await (basketManager as BasketManagerInstance).getBalanceInMasset(fake.address, token);
        const targetWeight =  await (rewardManager as RewardManagerInstance).getTargetWeight(token);
        console.log(
            'balance: ', balance.toString(), 
            ', weight: ', bnPerc(balance, totalBalance), 
            ', target: ', bnPerc(targetWeight, ONE));
        console.log();
    }

    //const tokens = await (rewardManager as RewardManagerInstance).getTokens();
    //console.log('tokens', tokens);
    
    const factor = await (rewardManager as RewardManagerInstance).getFactor();
    console.log('factor: ', bnPerc(factor, ONE));

    const globalMaxPenaltyPerc = await (rewardManager as RewardManagerInstance).getGlobalMaxPenaltyPerc();
    console.log('globalMaxPenaltyPerc: ', bnPerc(globalMaxPenaltyPerc, ONE.mul(PERC_FACTOR)));

    const globalMaxRewardPerc = await (rewardManager as RewardManagerInstance).getGlobalMaxRewardPerc();
    console.log('globalMaxRewardPerc: ', bnPerc(globalMaxRewardPerc, ONE.mul(PERC_FACTOR)));

    
    const token = '0xCB46c0ddc60D18eFEB0E586C17Af6ea36452Dae0';
    const sum = new BN('1574151745248594393265').div(new BN(2));

    const reward = await (rewardManager as RewardManagerInstance).getPenaltyForWithdrawal(token, sum);
    console.log('reward', reward.toString(), ', which is ', bnPerc(reward, sum));
    */
}
