import { formatEther, Transaction } from 'ethers'
import { convertEthToCurrency, getTimestampStartOfDayUTC } from './utils'
import { getCurrentEtherPrice, getEtherBalance, getTransactions } from './clients/etherscanClient'
import { getEthCoinPricesByTimestamp } from './services/coingeckoService'

// const ETH_ADDRESS = '0x5010Eb7A8c52cDB137F99F514864Bd792452dD76'
const { ETH_ADDRESS } = process.env
if (!ETH_ADDRESS) {
  console.log("ETH_ADDRESS isn't defined!")
  process.exit(1)
}

const printEtherBalance = async () => {
  const balance = await getEtherBalance(ETH_ADDRESS)
  const ethPrice = await getCurrentEtherPrice()

  console.log(`ETH balance: ${balance}`)
  console.log(`ETH price (usd): $${ethPrice}`)
  console.log(`Total value: $${convertEthToCurrency(balance, ethPrice)}`)
}

interface EthTimestampPriceValue {
  timestamp: number
  price: number
  value: bigint
  received: boolean
}

// should have 
//   - timestamp (original timestamp, not the updated one for coingecko api)
//   - price of eth at timestamp,
//   - sent/received? (boolean)
//   - amount of eth sent/received
interface AggregatedTxData {
  timestamp: number
  received: boolean
  value: string // total eth per tx in usd 
}

const getHistoricalEthData = async (ethValueAndTimestamps: EthValueAndTimestamp[]) => {
  const priceByTimestamp = await getEthCoinPricesByTimestamp(ethValueAndTimestamps)

  const timestampPriceValues: EthTimestampPriceValue[] = ethValueAndTimestamps.map(valueTimestamp => {
    return {
      ...valueTimestamp,
      price: priceByTimestamp.get(valueTimestamp.timestamp)!,
    }
  })

  // now we have the amount of ETH (value), and its approximate price. price * value will give us what we want
  // in wei
  return timestampPriceValues.map(({ timestamp, price, value, received }) => {
    const ethValue = formatEther(value)
    const ethValueUsd = convertEthToCurrency(ethValue, price)
    console.log(`timestamp: ${timestamp}, ethValue: ${ethValue}, ethValueUsd: ${ethValueUsd}`)
    return { timestamp, received, value: ethValueUsd} as AggregatedTxData
  })
}

type TxType = Omit<Transaction, 'value'> & { timeStamp: string, value: string }

interface EthValueAndTimestamp {
  timestamp: number
  value: bigint
  received: boolean
}

const getCapitalGainsInfo = async () => {
  const txList = await getTransactions(ETH_ADDRESS)

  const ethValueAndTimestamps: EthValueAndTimestamp[] = []

  let total = BigInt(0)
  const addr = ETH_ADDRESS.toLowerCase()
  for (let tx of txList) {
    const { to, from, value: valueStr } = tx

    // const formattedDate = formatTimestamp(tx)

    // to compare timestamp with those in api response, convert timestamp to Date and set hour/minute/sec to 0
    const updatedTimeStamp = getTimestampStartOfDayUTC(tx.timeStamp)
    const value = BigInt(valueStr)
    let received

    if (to === addr) { // recieved eth
      received = true
      total += value
    } else if (from === addr) { // sold? eth
      received = false
      total -= value
    } else {
      // TODO: is this ever reached?
      continue
    }

    ethValueAndTimestamps.push({ timestamp: updatedTimeStamp, value, received })
  }

  console.log(`total wei: ${total}`)
  console.log(`total eth: ${formatEther(total)}`)
  
  return getHistoricalEthData(ethValueAndTimestamps)
}

// getHistoricalEthData()

const main = async () => {
  const aggregatedData = await getCapitalGainsInfo()

  aggregatedData.forEach(({ timestamp, value, received }) => {
    let total = 0
    if (received) {
      total += Number(value)
    } else {
      total -= Number(value)
    }
  })

  // we have total, now just log each transaction data so the user could understand the capital gain result (total)
}

// main()

console.log('hello!')