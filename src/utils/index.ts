import { DateTimeFormatter, Instant, LocalDate } from '@js-joda/core'
import { TransactionResponseType } from '../clients/etherscanClient'

export const convertEthToCurrency = (eth: number | string, price: number) => {
  const balance = typeof eth === 'string' ? Number(eth) : eth
  return formatBalance(balance * price)
}

/**
 * 
 * @param balance 
 * @param decDigits Default value: 2
 * @returns 
 */
export const formatBalance = (balance: number | string, decDigits: number = 2) => 
  parseFloat(typeof balance === 'string'
    ? balance
    : balance.toString()
  ).toFixed(decDigits)

export const roundDecimals = (arg: number | string, decDigits: number) =>
  decDigits < 1
    ? formatBalance(arg)
    : formatBalance(arg, decDigits)

export const formatTimestamp = (ts: number | string) => 
  LocalDate.ofInstant(Instant.ofEpochSecond(Number(ts))).format(DateTimeFormatter.ofPattern('MM-dd-yyyy'))

export const timestampToMilliseconds = (timestamp: string) => parseInt(timestamp) * 1000

/**
 * Given a timestamp in seconds from epoch, return a timestamp from beginning of UTC day.
 * Returns new timestamp as a number.
 * 
 * E.g. input:  1711214484 (represented as Sat Mar 23 2024 17:21:24 GMT+0000)
 *      output: 1711152000 (represented as Sat Mar 23 2024 00:00:00 GMT+0000)
 * 
 * @param timestamp
 */
export const getTimestampStartOfDayUTC = (timestamp: string) => {
  const date = new Date(parseInt(timestamp) * 1000)
  date.setUTCHours(0, 0, 0, 0)
  return Math.floor(date.getTime() / 1000)
}

export const convertTimestampSecondsToDate = (timestamp: string) => {
  return new Date(parseInt(timestamp) * 1000)
}

// Util for transactions returned from Etherscan which stores addresses in lowercase.
export const isReceived = (tx: TransactionResponseType, address: string) => tx.to === address.toLowerCase()

// Util for transactions returned from Etherscan which stores addresses in lowercase.
export const isSent = (tx: TransactionResponseType, address: string) => tx.from === address.toLowerCase()