import { JsonRpcProvider, EtherscanProvider, InfuraProvider, formatEther, Transaction } from 'ethers'
import { LocalDate, DateTimeFormatter } from '@js-joda/core'
import { logToStdout } from './other'

const INFURA_API_KEY = '2a301d7db3c9481b93616d034f00aec1'
const NETWORK = 'sepolia' // eth testnet
const INFURA_URL = `https://${NETWORK}.infura.io/v3/${INFURA_API_KEY}`

const ETHERSCAN_API_KEY = 'P1KEMC5Q3G6IEHVQB1XATER1PP8RMWWWPC'

const COINGECKO_API_KEY = 'CG-ez1T9LMCCMEMRcL2t3dYupK9'
const COINGECKO_API_BASE = 'https://api.coingecko.com/api/v3/'
const COINGECKO_API_ENDPOINT = `/coins/{id}/market_chart`

const ETH_ADDRESS = '0x5010Eb7A8c52cDB137F99F514864Bd792452dD76'

const getEtherscanProvider = (() => {
  let provider: EtherscanProvider

  const getInstance = () => {
    if (!provider) {
      console.log('assigning singleton EtherscanProvider')
      provider = new EtherscanProvider(NETWORK, ETHERSCAN_API_KEY)
    }

    return provider
  }

  return getInstance
})()



// utilities
const convertEthToCurrency = (eth: number | string, price: number) => {
  const balance = typeof eth === 'string' ? Number(eth) : eth
  return formatBalance(balance * price)
}

const formatBalance = (balance: number | string) => 
  parseFloat(typeof balance === 'string' 
    ? balance 
    : balance.toString()
  ).toFixed(2)

const formatTimestamp = (tx: TxType) => 
  LocalDate.ofEpochDay(Number(tx.timeStamp)).format(DateTimeFormatter.ofPattern('dd-MM-yyyy'))

const timestampToMilliseconds = (timestamp: string) => parseInt(timestamp) * 1000

/**
 * Given a timestamp in seconds from epoch, return a timestamp from beginning of UTC day.
 * Returns new timestamp as a number.
 * 
 * E.g. input:  5526498 -> Thu Mar 05 1970 23:08:18 GMT+0000
 *      output: 5443200 -> Thu Mar 05 1970 00:00:00 GMT+0000
 * 
 * @param timestamp
 */
const getTimestampStartOfDayUTC = (timestamp: string) => {
  const date = new Date(parseInt(timestamp) * 1000)
  date.setUTCHours(0, 0, 0, 0)
  return Math.floor(date.getTime() / 1000)
}

const getEtherBalance = async () => {
  // const provider = new JsonRpcProvider(INFURA_URL)
  const etherscanProvider = new EtherscanProvider(NETWORK, ETHERSCAN_API_KEY)
  // const infuraProvider =  new InfuraProvider(NETWORK, 'joey-norkin-1', INFURA_API_KEY)

  etherscanProvider.getBalance
  const balance = formatEther(await etherscanProvider.getBalance(ETH_ADDRESS))
  // const ethPrice = await etherscanProvider.getEtherPrice()
  const ethPrice = parseFloat((await etherscanProvider.fetch('stats', { action: 'ethprice' })).ethusd)

  console.log(`ETH balance: ${balance}`)
  console.log(`ETH price (usd): $${ethPrice}`)
  console.log(`Total value: $${convertEthToCurrency(balance, ethPrice)}`)
}

interface CoinsFetchMarketChart {
  market_caps: number[][]
  prices: [timestamp: number, price: number][]
  total_volumes: number[][]
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
  const response = await fetch(`https://api.coingecko.com/api/v3/coins/ethereum/market_chart?vs_currency=usd&days=365&x_cg_demo_api_key=${COINGECKO_API_KEY}`)
  if (!response.ok) {
    throw new Error(`Response status: ${response.status}`)
  }

  const json = await response.json() as CoinsFetchMarketChart
  // response.prices => [ timestamp(string), price(string) ][]

  // filter entries with matching timestamps
  const timestamps = new Set(ethValueAndTimestamps.map(item => item.timestamp))
  // const prices = json.prices.filter(([ timestamp, _ ]) => timestamps.has(timestamp))
  const priceByTimestamp = new Map(json.prices.filter(([ timestamp, price ]) => timestamps.has(timestamp)))

  const timestampPriceValues: EthTimestampPriceValue[] = ethValueAndTimestamps.map(valueTimestamp => {
    const price = priceByTimestamp.get(valueTimestamp.timestamp)!
    return {
      ...valueTimestamp,
      price,
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
  const provider = getEtherscanProvider()
  const txList = await provider.fetch('account', {
    action: 'txlist',
    address: ETH_ADDRESS,
    startblock: 0,
    endblock: 99999999,
    page: 1,
    offset: 10,
    sort: 'desc',
  }) as TxType[]

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

logToStdout('hello again?')