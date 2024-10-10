## Capital Gains for ETH Transactions
Calculates capital gains of sent transactions of past year.

### Running locally:

```sh
nvm use
yarn && yarn build && yarn start
```

### Sample Output:
```
Address: 0x5010FAF7F21651FFEA146DE066EC74F19DEE4274 
Balance: 1.27
Transaction Hash: 0x62221BFE4B12326D9A25A40C52B8E8F5358A4D69E7C3AC326B159056DA88789F
Date Of Transaction: 03-23-2024
Block Timestamp: 1711214484
Block Date: Sat Mar 23 2024 13:21:24 GMT-0400 (Eastern Daylight Time)
ETH sent: 0.23 ETH @ $3322.89
Before sale, this address had 1.5 ETH with an average cost basis of $3336.62
Capital Gains: -$3.16
```

### Environment:
You will need an API Key from [Etherscan](https://docs.etherscan.io/getting-started/viewing-api-usage-statistics#creating-an-api-key) and [CoinGecko](https://docs.coingecko.com/v3.0.1/reference/setting-up-your-api-key) to run the app.

Create `.env` from the project's template:

```sh
cp .env.example .env
```
Then update `ETHERSCAN_API_KEY` and `COINGECKO_API_KEY` with your API Keys.

You could also store the Ethereum address and network type into `ETH_ADDRESS` and `NETWORK`. Note that this is optional. You could instead pass them as arguments. 

```sh
yarn start [<eth_address> [<network_type>]]
```

If NETWORK isn't provided by either of the methods, the program will default to `mainnet`.