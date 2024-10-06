## Capital Gains for ETH Transactions
Calculates capital gains of sent transactions of past year.

### Running locally:

```sh
nvm use
yarn && yarn build && yarn start
```

### Environment:
You will need an API Key from [Etherscan](https://docs.etherscan.io/getting-started/viewing-api-usage-statistics#creating-an-api-key) and [CoinGecko](https://docs.coingecko.com/v3.0.1/reference/setting-up-your-api-key) to run the app.

Create `.env` from the project's template:

```sh
cp .env.example .env
```
Then update `ETHERSCAN_API_KEY` and `COINGECKO_API_KEY` with your API Keys. For now, `ETH_ADDRESS` and `NETWORK` will also need to be defined.

<!-- command line args aren't implemented yet.

You could also store the Ethereum address and network type into `ETH_ADDRESS` and `NETWORK`. Note that this is optional. You could instead pass them as arguments. 

```sh
yarn start <eth_address> [<network_type>]
```

If NETWORK isn't provided by either of the methods, the program will default to `mainnet`.

-->