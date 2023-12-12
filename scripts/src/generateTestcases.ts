
class Case {
    deposit?: boolean;
    withdrawal?: boolean;
    initialBalances: number[];
    targetWeights: number[];
    factor: number;
    index: number;
    amount: number;
    result?: { dsqrBefore: number, dsqrAfter: number, penalty?: number, reward?: number }
    resultPerc?: number;
}

function getAverageDsqrs(initialBalances: number[], targetWeights: number[]): number {
    let dsqr = 0;
    const total = initialBalances.reduce((p, c) => p + c, 0);
    const weights = initialBalances.map(b => total > 0 ? b / total : 0);
    for(let i = 0; i < weights.length; i++) {
        dsqr += (weights[i] - targetWeights[i]) * (weights[i] - targetWeights[i]);
    }
    return dsqr / initialBalances.length;
}

function getReward(c: Case): { dsqrBefore: number, dsqrAfter: number, penalty?: number, reward?: number } {

    let dsqrBefore = getAverageDsqrs(c.initialBalances, c.targetWeights);
    let vBefore = dsqrBefore / (1 - dsqrBefore);
    const newBalances = c.initialBalances.map(v => v);
    newBalances[c.index] += c.amount;
    let dsqrAfter = getAverageDsqrs(newBalances, c.targetWeights);
    let vAfter = dsqrAfter / (1 - dsqrAfter);

    const r = vAfter < vBefore ? c.amount * c.factor * (vBefore - vAfter) : 0;
    return {
        reward: r > c.amount ? c.amount : r,
        dsqrBefore, dsqrAfter
    };
}

function getPenalty(c: Case): { dsqrBefore: number, dsqrAfter: number, penalty?: number, reward?: number } {

    let dsqrBefore = getAverageDsqrs(c.initialBalances, c.targetWeights);
    let vBefore = dsqrBefore / (1 - dsqrBefore);
    const newBalances = c.initialBalances.map(v => v);
    newBalances[c.index] -= c.amount;
    let dsqrAfter = getAverageDsqrs(newBalances, c.targetWeights);
    let vAfter = dsqrAfter / (1 - dsqrAfter);

    const p = vBefore < vAfter ? c.amount * c.factor * (vAfter - vBefore) : 0;
    return {
        penalty: p > c.amount ? c.amount : p,
        dsqrBefore, dsqrAfter
    };
}

export default async function calc(truffle): Promise<any> {

    console.log('Reward cases:');
    const rewardCases: Case[] = [
        {
            initialBalances : [1000, 1000, 1000, 1000], 
            targetWeights: [0.25, 0.25, 0.25, 0.25], 
            factor: 1, 
            index: 0, 
            amount: 1000
        },
        {
            initialBalances : [0, 0, 0, 0], 
            targetWeights: [1, 0, 0, 0], 
            factor: 1, 
            index: 0, 
            amount: 100
        },
        {
            initialBalances : [0, 1000, 1000, 1000], 
            targetWeights: [0.25, 0.25, 0.25, 0.25], 
            factor: 1, 
            index: 0, 
            amount: 1000
        },
        {
            initialBalances : [500, 1000, 1000, 1000], 
            targetWeights: [0.25, 0.25, 0.25, 0.25], 
            factor: 1, 
            index: 0, 
            amount: 500
        },
        {
            initialBalances : [900, 1000, 1000, 1000], 
            targetWeights: [0.25, 0.25, 0.25, 0.25], 
            factor: 1, 
            index: 0, 
            amount: 100
        },
        {
            initialBalances : [0, 1000, 1000, 1000], 
            targetWeights: [0.7, 0.1, 0.1, 0.1], 
            factor: 1, 
            index: 0, 
            amount: 1000
        },
        {
            initialBalances : [0, 1000, 1000, 1000], 
            targetWeights: [0.7, 0.1, 0.1, 0.1], 
            factor: 1, 
            index: 0, 
            amount: 4000
        },
        {
            initialBalances : [4000, 1000, 1000, 1000], 
            targetWeights: [0.7, 0.1, 0.1, 0.1], 
            factor: 1, 
            index: 0, 
            amount: 1000
        },
        {
            initialBalances : [6000, 1000, 1000, 1000], 
            targetWeights: [0.7, 0.1, 0.1, 0.1], 
            factor: 1, 
            index: 0, 
            amount: 1000
        },
        {
            initialBalances : [6000, 1000, 1000, 1000], 
            targetWeights: [0.7, 0.1, 0.1, 0.1], 
            factor: 2, 
            index: 0, 
            amount: 1000
        },
        {
            initialBalances : [6000, 1000, 1000, 1000], 
            targetWeights: [0.7, 0.1, 0.1, 0.1], 
            factor: 4, 
            index: 0, 
            amount: 1000
        },
        {
            initialBalances : [0, 1000, 1000, 1000], 
            targetWeights: [0.7, 0.1, 0.1, 0.1], 
            factor: 1000, 
            index: 0, 
            amount: 7000
        },
    ];

    rewardCases.forEach(c => {
        c.deposit = true;
        c.result = getReward(c);
        c.resultPerc = 100 * c.result.reward / c.amount;
        c.deposit = true;
        console.log(c);
    });

    console.log('Penalty cases:');
    const penaltyCases: Case[] = [
        {
            initialBalances : [2000, 1000, 1000, 1000], 
            targetWeights: [0.25, 0.25, 0.25, 0.25], 
            factor: 1, 
            index: 0, 
            amount: 1000
        },
        {
            initialBalances : [100, 0, 0, 0], 
            targetWeights: [1, 0, 0, 0], 
            factor: 1, 
            index: 0, 
            amount: 100
        },        
        {
            initialBalances : [1000, 1000, 1000, 1000], 
            targetWeights: [0.25, 0.25, 0.25, 0.25], 
            factor: 1, 
            index: 0, 
            amount: 1000
        },
        {
            initialBalances : [1000, 1000, 1000, 1000], 
            targetWeights: [1, 0, 0, 0], 
            factor: 1, 
            index: 0, 
            amount: 500
        },
        {
            initialBalances : [1, 0, 0, 0], 
            targetWeights: [1, 0, 0, 0], 
            factor: 1, 
            index: 0, 
            amount: 1
        },
        {
            initialBalances : [1000, 1000, 1000, 1000], 
            targetWeights: [1, 0, 0, 0], 
            factor: 1, 
            index: 0, 
            amount: 1000
        },
        {
            initialBalances : [1000000, 1000000, 1000000, 1000000], 
            targetWeights: [1, 0, 0, 0], 
            factor: 1, 
            index: 0, 
            amount: 1000000
        },
        {
            initialBalances : [1000, 1000, 1000, 1000], 
            targetWeights: [1, 0, 0, 0], 
            factor: 2, 
            index: 0, 
            amount: 1000
        },
        {
            initialBalances : [1000, 1000, 1000, 1000], 
            targetWeights: [1, 0, 0, 0], 
            factor: 4, 
            index: 0, 
            amount: 1000
        },
        {
            initialBalances : [1000, 1000, 1000, 1000], 
            targetWeights: [1, 0, 0, 0], 
            factor: 1000, 
            index: 0, 
            amount: 1000
        },
    ];

    penaltyCases.forEach(c => {
        c.withdrawal = true;
        c.result = getPenalty(c);
        c.resultPerc = 100 * c.result.penalty / c.amount;
        console.log(c);
    });
}
