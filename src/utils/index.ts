import { DateTimeFormatter, LocalDate } from '@js-joda/core'
import { TransactionResponseType } from '../clients/etherscanClient'

export const convertEthToCurrency = (eth: number | string, price: number) => {
  const balance = typeof eth === 'string' ? Number(eth) : eth
  return formatBalance(balance * price)
}

export const formatBalance = (balance: number | string) => 
  parseFloat(typeof balance === 'string' 
    ? balance 
    : balance.toString()
  ).toFixed(2)

export const formatTimestamp = (tx: TransactionResponseType) => 
  LocalDate.ofEpochDay(Number(tx.timeStamp)).format(DateTimeFormatter.ofPattern('dd-MM-yyyy'))

export const timestampToMilliseconds = (timestamp: string) => parseInt(timestamp) * 1000

/**
 * Given a timestamp in seconds from epoch, return a timestamp from beginning of UTC day.
 * Returns new timestamp as a number.
 * 
 * E.g. input:  5526498 -> Thu Mar 05 1970 23:08:18 GMT+0000
 *      output: 5443200 -> Thu Mar 05 1970 00:00:00 GMT+0000
 * 
 * @param timestamp
 */
export const getTimestampStartOfDayUTC = (timestamp: string) => {
  const date = new Date(parseInt(timestamp) * 1000)
  date.setUTCHours(0, 0, 0, 0)
  return Math.floor(date.getTime() / 1000)
}