const { COINGECKO_API_KEY } = process.env

if (!COINGECKO_API_KEY) {
  throw new Error('COINGECKO_API_KEY must be defined')
}

export const API_KEY = COINGECKO_API_KEY