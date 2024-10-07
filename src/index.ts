import { formatEther } from 'ethers'
import { findEthPriceByTimestampSeconds, getEthPricesUsd } from './clients/coingeckoClient'
import { getEthBalance, getTransactions } from './clients/etherscanClient'
import {
  convertTimestampSecondsToDate,
  formatBalance,
  formatTimestamp,
  formatTimestampUTC,
  getTimestampStartOfDayUTC,
  isReceived,
  isSent,
  roundDecimals,
} from './utils'

const main = async (address: string) => {
  const [ethBalance, txList, ethPricesUsd] = await Promise.all([
    getEthBalance(address),
    getTransactions(address),
    getEthPricesUsd(),
  ])

  // Get received txs up until we find a sent tx
  let txIndex = txList.findIndex(tx => isReceived(tx, address))
  let sentTxIndex = txList.findIndex(tx => isSent(tx, address))
  const recTxs = txList.splice(txIndex, sentTxIndex)

  // TODO: 
  // if txIndex === -1, we have nothing to calculate costBasis with.
  // if sentTxIndex === -1, then we need to call getTransactions api for the next page.
  // For now assume there no more than 10 Txs, and assume there exists a "sent" tx.

  const [totalSpent, totalEth] = recTxs.reduce(([prevTotalSpent, prevTotalEth], tx) => {
    const startOfDayTs = getTimestampStartOfDayUTC(tx.timeStamp)
    const [, ethPriceUsd] = findEthPriceByTimestampSeconds(ethPricesUsd, startOfDayTs) ?? []
    if (!ethPriceUsd) {
      console.log(
        `Could not find historical ETH price on ${startOfDayTs} (${formatTimestampUTC(startOfDayTs)}) for ` +
        `(Received) Transaction[hash=${tx.hash} timeStamp=${tx.timeStamp} (${convertTimestampSecondsToDate(tx.timeStamp)})]`
      )
      process.exit(1)
    }
    const txValueEth = parseFloat(formatEther(tx.value))
    return [
      prevTotalSpent + ethPriceUsd * txValueEth,
      prevTotalEth + txValueEth,
    ]
  }, [0, 0])

  const costBasis = totalSpent / totalEth

  const sentTx = txList.shift()
  if (!sentTx) {
    // TODO: get txs from next page in API then continue CB calculation.
    // If there are no more txs, only calculate the CB since cap gains do not apply here.
    console.log(`\nWe are unable to calculate capital gains since there are no sent transactions to be found.`)
    console.log(`Address: ${address}`)
    console.log(`This address has ${roundDecimals(ethBalance, 2)} ETH with an average cost basis of $${formatBalance(costBasis)}`)
    process.exit(0)
  }

  const sentTxStartOfDayTs = getTimestampStartOfDayUTC(sentTx.timeStamp)
  const ethPriceArr = findEthPriceByTimestampSeconds(ethPricesUsd, sentTxStartOfDayTs)
  if (!ethPriceArr) {
    console.log(
      `Could not find historical ETH price on ${sentTxStartOfDayTs} (${formatTimestampUTC(sentTxStartOfDayTs)}) for ` +
      `(Sent) Transaction[hash=${sentTx.hash} timeStamp=${sentTx.timeStamp} (${formatTimestamp(sentTx.timeStamp)})]`
    )
    process.exit(1)
  }
  const [_, sentTxEthPriceUsd] = ethPriceArr

  const ethSent = formatEther(sentTx.value)
  const capGain = (sentTxEthPriceUsd - costBasis) * parseFloat(ethSent)

  console.log(
    `\nAddress: ${address}\n` +
    `Balance: ${roundDecimals(ethBalance, 2)}\n` +
    `Transaction Hash: ${sentTx.hash}\n` +
    `Date Of Transaction: ${formatTimestampUTC(sentTxStartOfDayTs)}\n` +
    `Block Timestamp: ${sentTx.timeStamp}\n` +
    `Block Date: ${convertTimestampSecondsToDate(sentTx.timeStamp)}\n` +
    `ETH sent: ${roundDecimals(ethSent, 2)} ETH @ $${formatBalance(sentTxEthPriceUsd)}\n` +
    `Before sale, this address had ${totalEth} ETH with an average cost basis of $${formatBalance(costBasis)}\n` +
    `Capital Gains: ${capGain < 0 ? '-$' + (formatBalance(-capGain)) : '$' + formatBalance(capGain)}\n`
  )
}

const [
  eth_addr,
  // TODO: network,
] = process.argv.slice(2)

const { ETH_ADDRESS } = process.env

const address = eth_addr ?? ETH_ADDRESS
if (!address) {
  console.log('ETH_ADDRESS must be defined!')
  process.exit(1)
}

main(address)