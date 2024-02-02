import state from '../../migrations/state';
import { BasketManagerInstance, ERC20Instance, MassetInstance, MassetProxyInstance, TokenInstance } from 'types/generated';
import { knownBridges, knownFactors, knownTokens, knownTokensAddressToName } from './knownTokens';
import { ZERO_ADDRESS } from '@utils/constants';
import BN from "bn.js";

const ONE = new BN('1000000000000000000');

export default async function upgradeRewardManager(truffle): Promise<any> {

    const artifacts = truffle.artifacts;
    const provider = truffle.web3.currentProvider;
    const network = truffle.artifacts.options.network;
    state.setNetwork(network);

    console.log(provider.getAddress(0), provider.getAddress(1));

    const Token = artifacts.require("Token");

    const Masset = artifacts.require("Masset");
    const masset = await state.getDeployed(Masset, 'MassetProxy');
    const basketManagerAddress = await (masset as MassetInstance).getBasketManager();
    const BasketManager = artifacts.require("BasketManager");
    const basketManager = await BasketManager.at(basketManagerAddress);

    let bassets = await (basketManager as BasketManagerInstance).getBassets();
    bassets = bassets.map(s => s.toLowerCase());

    const tokenNames = knownTokensAddressToName[network];

    for(const token of bassets) {
        console.log('token: ', tokenNames[token]);
    }

    //await (basketManager as BasketManagerInstance).removeBasset(knownTokens[network]['TST5']);

    // const token = await Token.at('0xa9262CC3fB54Ea55B1B0af00EfCa9416B8d59570');
    // await (token as TokenInstance).mint('0x94e907f6B903A393E14FE549113137CA6483b5ef', '100000000000000000000000000');
    // await (token as TokenInstance).mint('0xC1aEAafa4a9Bf0A74464D496D220Bf89Ce9BF901', '100000000000000000000000000');

    // const tokens = ['TST6'];

    // for(const symbol of tokens) {
    //     const token = await Token.new();
    //     await (token as TokenInstance).initialize(symbol, symbol, 18);
    //     await (token as TokenInstance).mint('0x94e907f6B903A393E14FE549113137CA6483b5ef', '100000000000000000000000000');
    //     await (token as TokenInstance).mint('0xC1aEAafa4a9Bf0A74464D496D220Bf89Ce9BF901', '100000000000000000000000000');
    //     console.log('created ', symbol, '   adress: ', token.address);
    // }

    // for(const basset of bassets) {
    //     console.log('removing ', basset);
    //     await (basketManager as BasketManagerInstance).removeBasset(basset);
    // }


    // for(const symbol of Object.keys(knownTokens.rskTestnet)) {
    //     const basset = knownTokens.rskTestnet[symbol];
    //     if(bassets.find(s => s == basset)) continue;
    //     console.log('adding ', symbol, '   address ', basset);
    //     const bridge = knownBridges.rskTestnet[symbol];
    //     const factor = knownFactors.rskTestnet[symbol];
    //     await (basketManager as BasketManagerInstance).addBasset(basset, factor, bridge);
    // }
}
