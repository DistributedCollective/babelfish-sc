
function dSqrFunction(balances, targets, total) {
    const weights = balances.map(b => b / total);
    let d = 0;
    for (let i = 0; i < weights.length; i++) {
        d += (weights[i] - targets[i]) * (weights[i] - targets[i]);
    }
    return d / weights.length;
};

function vFunction(balances, targets, total, factor) {
    let d = dSqrFunction(balances, targets, total);
    return factor * d / (1 / d);
};

function main() {

    const balances = 

}


main();

