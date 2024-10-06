import { CoinGeckoClient, type CoinMarketChartResponse } from 'coingecko-api-v3'
import { API_KEY } from '../constants/coingeckoConstants'

const client = new CoinGeckoClient()
client.apiKey = API_KEY

// export const getMarketChart = async (coinId = 'ethereum', currency = 'usd') => {
//   const response = await fetch(`https://api.coingecko.com/api/v3/coins/${coinId}/market_chart?vs_currency=${currency}&days=365&x_cg_demo_api_key=${API_KEY}`)
//   if (!response.ok) {
//     throw new Error(`Response status: ${response.status}`)
//   }
//   return await response.json() as GetMarketChartResponse
// }

type GetMarketChartResponse = Omit<CoinMarketChartResponse, 'prices'> & {
  prices: [number, number][] // [timestamp, price]
}

export const getMarketChart = async (coinId: string, currency: string) => {
  return await client.coinIdMarketChart({ id: coinId, vs_currency: currency, days: 365 }) as GetMarketChartResponse
}

/**
 * @returns [number, number][], with each item being [timestamp, price]
 */
export const getEthPricesUsd = async () => (await getMarketChart('ethereum', 'usd')).prices
