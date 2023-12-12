export const knownTokens = {
    rsk: {
        'DAIES': '0x1a37c482465e78E6dabE1eC77b9A24d4236D2A11',
        'USDCES': '0x8D1F7cBC6391d95E2774380E80a666fEBf655d6B',
        'USDTES': '0xD9665Ea8F5Ff70CF97e1b1CD1B4Cd0317B0976e8',
        'BUSDBS': '0x61e9604E31a736129D7f5c58964C75935b2D80d6',
        'DAIBS': '0x6A42FF12215a90F50866a5CE43a9c9c870116E76',
        'USDCBS': '0x91eDceE9567cD5612C9DeDeAAe24D5e574820Af1',
        'USDTBS': '0xFf4299bcA0313c20A61dC5Ed597739743bEf3f6D',
        'RUSDT': '0xef213441A85dF4d7ACbDaE0Cf78004e1E486bB96',
        'RDOC': '0x2d919F19D4892381D58edeBeca66D5642Cef1a1f',
        'DOC': '0xe700691dA7b9851F2F35f8b8182c69c53CcaD9Db',
        'DLLR': '0xc1411567d2670e24d9C4DaAa7CdA95686e1250AA'
    },
    rskTestnet: {
        'SEPUSDES': '0x30199fc1322b89bbe8b575ba4f695632961fc8f3',
        'tDOC': '0xad0d0d04ec0cf442204908fc2cc18503ead06d3e',
        'tRDOC': '0xdbdc2d486c10c23902a46a17bec1f7de64075257',
        'trUSDT': '0x71e14cb1d752b88215782f2d6af01327cb483a0e',
        'tZUSD': '0x6b41566353d6c7b8c2a7931d498f11489dacac29',
        'DLLR': '0x007b3aa69a846cb1f76b60b3088230a52d2a83ac',
        'TST1': '0x9552f2e86b38b6545f7a3ff871b1f3e0023fa841',
        'TST2': '0x36f737dcaf6b2480f3163602c7cf85c9661527d4',
        'TST3': '0xf177355fffbf1096436c43354b6b653c08ff75ee',
        'TST4': '0x12aff942bafc1394acc3fdef28f41fd3f008b32d',
        'TST5': '0x02adba17629c1c9a99d541ba30cc65d6862e260a',
        'TST6': '0xd1179afa75dcdeaa5bd6c0da705e67d268a2d7c3'
    }
};

export const knownTokenNames = {
    rsk: Object.keys(knownTokens.rsk),
    rskTestnet: Object.keys(knownTokens.rskTestnet),
};

export const knownTokensAddressToName = {
    rsk: {},
    rskTestnet: {}
};
knownTokenNames.rsk.forEach(name => {
    knownTokensAddressToName.rsk[knownTokens.rsk[name].toLowerCase()] = name;
});
knownTokenNames.rskTestnet.forEach(name => {
    knownTokensAddressToName.rskTestnet[knownTokens.rskTestnet[name]] = name;
});

export const knownBridges = {
    rsk: {
        'DAIES': '0x1ccad820b6d031b41c54f1f3da11c0d48b399581',
        'USDCES': '0x1ccad820b6d031b41c54f1f3da11c0d48b399581',
        'USDTES': '0x1ccad820b6d031b41c54f1f3da11c0d48b399581',
        'BUSDBS': '0x971b97c8cc82e7d27bc467c2dc3f219c6ee2e350',
        'DAIBS': '0x971b97c8cc82e7d27bc467c2dc3f219c6ee2e350',
        'USDCBS': '0x971b97c8cc82e7d27bc467c2dc3f219c6ee2e350',
        'USDTBS': '0x971b97c8cc82e7d27bc467c2dc3f219c6ee2e350',
        'RUSDT': '0x0000000000000000000000000000000000000000',
        'RDOC': '0x0000000000000000000000000000000000000000',
        'DOC': '0x0000000000000000000000000000000000000000',
        'ZUSD': '0x0000000000000000000000000000000000000000'  
    },
    rskTestnet: {
        'SEPUSDES': '0xfBd57AB1dCE7B4fE191Ff947dDbB5118e4318207',
        'tDOC': '0x0000000000000000000000000000000000000000',
        'tRDOC': '0x0000000000000000000000000000000000000000',
        'trUSDT': '0x0000000000000000000000000000000000000000',
        'tZUSD': '0x0000000000000000000000000000000000000000',
        'DLLR': '0x0000000000000000000000000000000000000000',
        'TST1': '0x0000000000000000000000000000000000000000',
        'TST2': '0x0000000000000000000000000000000000000000',
        'TST3': '0x0000000000000000000000000000000000000000',
        'TST4': '0x0000000000000000000000000000000000000000',
        'TST5': '0x0000000000000000000000000000000000000000',
        'TST6': '0x0000000000000000000000000000000000000000'
    }
};

export const knownFactors = {
    rsk: {
        'DAIES': 1,
        'USDCES': 1,
        'USDTES': 1,
        'BUSDBS': 1,
        'DAIBS': 1,
        'USDCBS': 1,
        'USDTBS': 1,
        'RUSDT': 1,
        'RDOC': 1,
        'DOC': 1,
        'ZUSD': 1  
    },
    rskTestnet: {
        'SEPUSDES': 1,
        'tDOC': 1,
        'tRDOC': 1,
        'trUSDT': 1,
        'tZUSD': 1,
        'DLLR': 1,
        'TST1': 1,
        'TST2': 1,
        'TST3': 1,
        'TST4': 1,
        'TST5': 1,
        'TST6': 1  
    }
}
