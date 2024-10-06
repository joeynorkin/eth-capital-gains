import { getEthPricesUsd } from '../clients/coingeckoClient'

// type Timestamp = { timestamp: number }
type ObjectWithTimestamp = { timestamp: number }

/**
 * @param ethValueAndTimestamps 
 * @returns Map of timestamp -> price
 */
export const getEthCoinPricesByTimestamp = async (objWithTimestamps: ObjectWithTimestamp[]) => {
  const ethCoinPrices = await getEthPricesUsd()
  // filter ethCoinPrice entries containing matching timestamps
  const timestamps = new Set(objWithTimestamps.map(({ timestamp }) => timestamp))
  return new Map(ethCoinPrices.filter(([timestamp]) => timestamps.has(timestamp)))
}

export const getEthCoinPricesForEachTimestamp_ = async (timestamps: number[] | ObjectWithTimestamp[]) => {
  const isArrayOfNumbers = (arr: number[] | ObjectWithTimestamp[]): arr is number[] => 
    (arr[0] as ObjectWithTimestamp).timestamp === undefined

  const ethCoinPrices = await getEthPricesUsd()
  const timestampSet = new Set(isArrayOfNumbers(timestamps) ? timestamps : timestamps.map(({ timestamp }) => timestamp))
  return new Map(ethCoinPrices.filter(([timestamp]) => timestampSet.has(timestamp)))
}
