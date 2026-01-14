# replaceRUSDTWithUSDT0

This script handles the migration from RUSDT to USDT0 in the Babelfish system by updating the BasketManager's accepted tokens.

## Overview

The script performs a token replacement operation in the BasketManager contract, specifically:
- Removing RUSDT from the accepted tokens basket
- Adding USDT0 as a new accepted token with a 1:1 conversion ratio

## Prerequisites

1. Environment Setup:
   - Truffle environment configured
   - Valid network configuration in `truffle-config.js`
   - HDWalletProvider with funded accounts

2. Contract Requirements:
   - Deployed Masset contract
   - Deployed BasketManager contract
   - Caller must have owner permissions on BasketManager

3. Configuration:
   - Network-specific token addresses in `knownTokens.ts`:
     - RUSDT address
     - USDT0 address

## Usage

```bash
npx truffle exec scripts/src/replaceRUSDTWithUSDT0.ts --network <network_name>
```

Replace `<network_name>` with one of:
- rsk
- rskTestnet

## Process Flow

1. **Initial Setup**
   - Connects to specified network
   - Loads contract artifacts
   - Retrieves deployed contract instances

2. **Version Verification**
   - Checks current Masset version
   - Verifies BasketManager version
   - Logs initial state

3. **Token Replacement**
   - Removes RUSDT using `removeBasset`
   - Adds USDT0 using `addBasset`
   - Parameters for USDT0:
     - Conversion factor: 1
     - Bridge: ZERO_ADDRESS

4. **Verification**
   - Retrieves updated bassets list
   - Logs final state for confirmation
