const { ETHERSCAN_API_KEY, NETWORK } = process.env

if (!ETHERSCAN_API_KEY) {
  throw new Error('ETHERSCAN_API_KEY must be defined')
}

export const API_KEY = ETHERSCAN_API_KEY

const network = NETWORK?.trim().toLowerCase() ?? 'mainnet'
if (!['mainnet', 'sepolia'].includes(network)) {
  throw new Error(`Network '${NETWORK}' is not supported`)
}

export { network as NETWORK }