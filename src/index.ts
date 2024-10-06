import { formatEther } from 'ethers'
import { findEthPriceByTimestampSeconds, getEthPricesUsd } from './clients/coingeckoClient'
import { getTransactions } from './clients/etherscanClient'
import { convertTimestampSecondsToDate, formatBalance, formatTimestamp, getTimestampStartOfDayUTC, isReceived, isSent, roundDecimals } from './utils'

const main = async (address: string) => {
  const [txList, ethPricesUsd] = await Promise.all([getTransactions(address), getEthPricesUsd()])

  // find first "received" tx
  let txIndex = txList.findIndex(tx => isReceived(tx, address))

  // find first "sent" tx
  let sentTxIndex = txList.findIndex(tx => isSent(tx, address))

  // TODO: 
  // if txIndex === -1, we have nothing to calculate costBasis with.
  // if sentTxIndex === -1, then we need to call getTransactions api for the next page.
  // For now assume there no more than 10 Txs, and assume there exists a "sent" tx.

  const recTxs = txList.splice(txIndex, sentTxIndex)
  let totalSpent = 0
  let totalEth = 0
  for (let tx of recTxs) {
    const startOfDayTs = getTimestampStartOfDayUTC(tx.timeStamp)
    const ethPriceArr = findEthPriceByTimestampSeconds(ethPricesUsd, startOfDayTs)
    if (!ethPriceArr) {
      console.log(
        `Could not find historical ETH price on ${startOfDayTs} (${formatTimestamp(startOfDayTs)}) for ` +
        `(Received) Transaction[hash=${tx.hash} timeStamp=${tx.timeStamp} (${convertTimestampSecondsToDate(tx.timeStamp)})]`
      )
      process.exit(1)
    }
    const [_ , ethPriceUsd] = ethPriceArr
    const txValueEth = parseFloat(formatEther(tx.value))
    totalSpent += ethPriceUsd * txValueEth
    totalEth += txValueEth
  }

  const costBasis = totalSpent / totalEth

  const sentTx = txList.shift() // Now, the first item in list is either a "sent" tx, or the txList is empty
  if (!sentTx) {
    // get more Txs from the next "page" of API, but for now we'll just exit.
    // When continuing CB calc with next page of Tx, we could add this current iteration
    // of totalSpent and totalEth with the next iteration, etc.
    //
    // Or, we went through all Txs and there's no "sent" Tx to be found. In this case we will
    // just calculate the costBasis since cap gains do not apply here.
    console.log(`Couldn't to find a sentTx. Update code to retrieve Transaction`)
    process.exit(1)
  }

  const sentTxStartOfDayTs = getTimestampStartOfDayUTC(sentTx.timeStamp)
  const ethPriceArr = findEthPriceByTimestampSeconds(ethPricesUsd, sentTxStartOfDayTs)
  if (!ethPriceArr) {
    console.log(
      `Could not find historical ETH price on ${sentTxStartOfDayTs} (${formatTimestamp(sentTxStartOfDayTs)}) for ` +
      `(Sent) Transaction[hash=${sentTx.hash} timeStamp=${sentTx.timeStamp} (${formatTimestamp(sentTx.timeStamp)})]`
    )
    process.exit(1)
  }
  const [_ , sentTxEthPriceUsd] = ethPriceArr

  const ethSent = formatEther(sentTx.value)
  const capGain = (sentTxEthPriceUsd - costBasis) * parseFloat(ethSent)

  console.log(
    `Address: ${address}\n` +
    `Transaction Hash: ${sentTx.hash}\n` +
    `Date Of Transaction: ${formatTimestamp(sentTxStartOfDayTs)}\n` +
    `Block Timestamp: ${sentTx.timeStamp}\n` +
    `Block Date: ${convertTimestampSecondsToDate(sentTx.timeStamp)}\n` +
    `ETH sent: ${roundDecimals(ethSent, 3)} ETH @ $${formatBalance(sentTxEthPriceUsd)}\n` +
    `Before sale, this address had ${totalEth} ETH with an average cost basis of $${formatBalance(costBasis)}\n` +
    `Capital Gains: ${capGain < 0 ? '-$' + (formatBalance(-capGain)) : '$' + formatBalance(capGain)}`
  )
}


const { ETH_ADDRESS } = process.env
if (!ETH_ADDRESS) {
  console.log('ETH_ADDRESS must be defined!')
  process.exit(0)
}

main(ETH_ADDRESS)