import state from '../../migrations/state';
import { BasketManagerInstance, MassetInstance, MassetProxyInstance } from 'types/generated';
import { knownBridges, knownFactors, knownTokens } from './knownTokens';
import { ZERO_ADDRESS } from '@utils/constants';

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

    const BasketManager = artifacts.require("BasketManager");
    
    let basketManager;

    console.log('STEP 1: Upgrade basket manager if needed...');
    {
        const basketManagerAddress = await (fake as MassetInstance).getBasketManager();
        console.log('current basket manager: ', basketManagerAddress);
        basketManager = await BasketManager.at(basketManagerAddress);
        const version = await (basketManager as BasketManagerInstance).getVersion();
        console.log('Basket manager version: ', version);
        if (version != '4.0') {
            const tokenNames = Object.keys(knownTokens[network]);
            const addresses = tokenNames.map(tn => knownTokens[network][tn]);
            const bridges = tokenNames.map(tn => knownBridges[network][tn]);
            const factors = tokenNames.map(tn => knownFactors[network][tn]);
            basketManager = await state.forceDeploy(BasketManager, 'BasketManager',
                () => BasketManager.new(addresses, factors, bridges));
            console.log('new basket manager: ', basketManager.address);
            const version = await (basketManager as BasketManagerInstance).getVersion();
            console.log('Basket manager version: ', version);
        } else {
            console.log('No change');
        }
    }
    console.log('Done.');

    if (network == 'rskTestnet') {

        console.log('STEP 2: set basket manager in Masset...');
        {
            const oldBasketManagerAddress = await (fake as MassetInstance).getBasketManager();
            console.log('Old basket manager: ', oldBasketManagerAddress);
            if (oldBasketManagerAddress != basketManager.address) {
                console.log('Setting...');
                await (fake as MassetInstance).setBasketManager(basketManager.address);
                const newBasketManagerAddress = await (fake as MassetInstance).getBasketManager();
                console.log('New basket manager: ', newBasketManagerAddress);
            } else {
                console.log('No change');
            }
        }
        console.log('Done.');

    } else if (network == 'rsk') {

        console.log('STEP 2: set basket manager owner...');
        {
            const multiSigAddress = '0x37a706259f5201c03f6cb556a960f30f86842d01';
            const owner = await (basketManager as BasketManagerInstance).owner();
            console.log('Current owner: ', owner);
            if(owner != multiSigAddress) {
                console.log('Setting...');
                await (basketManager as BasketManagerInstance).transferOwnership(multiSigAddress);
                const owner = await (basketManager as BasketManagerInstance).owner();
                console.log('New owner: ', owner);
            } else {
                console.log('No change');
            }
        }
        console.log('Done.');

        console.log('STEP 3: set basket manager in Masset...');
        {
            const oldBasketManagerAddress = await (fake as MassetInstance).getBasketManager();
            console.log('Old basket manager: ', oldBasketManagerAddress);
            if (oldBasketManagerAddress != basketManager.address) {
                console.log('Setting...');

                const massetOwner = await (fake as MassetInstance).owner();
                console.log('massetOwner: ', massetOwner);

                const abi = fake.contract.methods['setBasketManager(address)'](basketManager.address).encodeABI();
                console.log(`send to: ${fake.address}, ABI: ${abi}`);

                return;

            } else {
                console.log('No change');
            }
        }
        console.log('Done.');
    }
}
