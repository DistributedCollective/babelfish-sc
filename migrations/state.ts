import fs from 'fs';
import Truffle from 'truffle';

let state = null;
let network = 'localhost';

async function setNetwork(_network: string): Promise<void> {
    network = _network;
    /*
    return new Promise<void>((resolve, reject) => {
        fs.exists(`state_${network}.json`, async (exists) => {
            if (!exists) await writeState({});
            resolve();
        });
    });
    */
}

async function forceDeploy(contract: Truffle.Contract, key: string, deployfunc): Promise<any> {
    if (!state) {
        state = await readState();
    }
    console.log('Forced deploy: ', key);
    const c = await deployfunc();
    state[key] = { address: c.address };
    await writeState(state);
    return c;
}

async function conditionalDeploy(contract: Truffle.Contract, key: string, deployfunc): Promise<any> {
    if (!state) {
        state = await readState();
    }
    console.log('Conditional deploy: ', key);
    if (!state[key] || !state[key].address) {
        const c = await deployfunc();
        state[key] = { address: c.address };
        await writeState(state);
        return c;
    }
    console.log('Already deployed at: ', state[key].address);
    return contract.at(state[key].address);
}

async function conditionalInitialize(key: string, initfunc) {
    if (!state) {
        state = await readState();
    }
    console.log('Conditional initialization: ', key);
    if (!state[key]) state[key] = {};
    if (state[key].initialized) {
        console.log('Already initialized');
        return;
    }
    await initfunc();
    state[key].initialized = true;
    await writeState(state);
}

async function getDeployed(contract: Truffle.Contract, key: string): Truffle.Contract {
    if (!state) {
        state = await readState();
    }
    if (!state[key] || !state[key].address) {
        throw new Error('Not deployed: ' + key);
    }

    return contract.at(state[key].address);
}

async function readState(): Promise<any> {
    return new Promise<any>((resolve, reject) => {
        fs.readFile(`state_${network}.json`, (err, data) => {
            if (err) return reject(err);
            resolve(JSON.parse(data.toString('utf-8')));
        });
    });
}

function writeState(obj): Promise<void> {
    return new Promise<any>((resolve, reject) => {
        fs.writeFile(`state_${network}.json`, JSON.stringify(obj, null, 2), (err) => {
            if (err) return reject(err);
            resolve();
        });
    });
}

async function printState() {
    console.log(state);
}

export default { conditionalDeploy, conditionalInitialize, getDeployed, printState, setNetwork, forceDeploy };
