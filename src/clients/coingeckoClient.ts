import { CoinGeckoClient, type CoinMarketChartResponse } from 'coingecko-api-v3'
// import { API_KEY } from '../constants/coingeckoConstants'

const client = new CoinGeckoClient()
// const client = new CoinGeckoClient()
// client.apiKey = API_KEY

type GetMarketChartResponse = Omit<CoinMarketChartResponse, 'prices'> & {
  prices: [number, number][] // [timestamp, price]
}

// export const getMarketChart = async (coinId: string, currency: string) => {
//   const response = await fetch(`https://api.coingecko.com/api/v3/coins/${coinId}/market_chart?vs_currency=${currency}&days=365&x_cg_demo_api_key=${API_KEY}`)
//   if (!response.ok) {
//     throw new Error(`Response status: ${response.status}`)
//   }
//   return await response.json() as GetMarketChartResponse
// }

export const getMarketChart = async (coinId: string, currency: string) => {
  try {
    return await client.coinIdMarketChart({ id: coinId, vs_currency: currency, days: 365 }) as GetMarketChartResponse
  } catch (err) {
    if (err instanceof Error) {
      console.log('Error occurred in coingeckClient.getMarketChart:', err.message, err.stack)
    } else {
      console.log('Some error occurred', err)
    }
    process.exit(1)
  }
}

/**
 * Get historical ETH prices in USD. Timestamps are in milliseconds.
 * 
 * @returns [number, number][], with each item being [timestamp, price]
 */
export const getEthPricesUsd = async () => (await getMarketChart('ethereum', 'usd')).prices

/**
 * Do we want the returned timestamp to be in seconds?
 * 
 * @param ethPrices Array returned from {@link getEthPricesUsd}
 * @param targetTs Timestamp in milliseconds
 * @returns [ timestamp, price ] or undefined if no match is found
 */
export const findEthPriceByTimestampSeconds = (ethPrices: [number, number][], targetTs: number) =>
  ethPrices.find(([ts]) => (ts / 1000) === targetTs)
