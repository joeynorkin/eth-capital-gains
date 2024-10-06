import { formatEther } from 'ethers'
import { getEthPricesUsd } from './clients/coingeckoClient'
import { getTransactions } from './clients/etherscanClient'
import { formatTimestamp, getTimestampStartOfDayUTC, isReceived, isSent } from './utils'

const main = async (address: string) => {
  const [txList, ethPricesUsd] = await Promise.all([getTransactions(address), getEthPricesUsd()])

  // find first "received" tx
  let txIndex = txList.findIndex(tx => isReceived(tx, address))

  // find first "sent" tx
  let sentTxIndex = txList.findIndex(tx => isSent(tx, address))

  // TODO: if sentTxIndex === -1, then we need to call getTransactions api for the next page.
  // For now assume there no more than 10 Txs.

  const recTxs = txList.splice(txIndex, sentTxIndex)
  let totalSpent = 0
  let totalEth = 0
  for (let tx of recTxs) {
    const startOfDayTs = getTimestampStartOfDayUTC(tx.timeStamp)
    const ethPriceArr = ethPricesUsd.find(([ts]) => ts === startOfDayTs)
    if (!ethPriceArr) {
      console.log(
        `Could not find historical ETH price on ${startOfDayTs} (${formatTimestamp(startOfDayTs)}) for ` +
        `Transaction[hash=${tx.hash} timeStamp=${tx.timeStamp} (${formatTimestamp(tx.timeStamp)})]`
      )
      process.exit(1)
    }
    const [_ , ethPriceUsd] = ethPriceArr
    const txValueEth = parseFloat(formatEther(tx.value))
    totalSpent += ethPriceUsd * txValueEth
    totalEth += txValueEth
  }

  const costBasis = totalSpent / totalEth

  // CapitalGain = parseFloat(formatEther(sentTx.value)) * (sentTxEthPriceUsd - costBasis).

  // Need sentTx from txList (I think this should be found at txList[txIndex] after the splice above),
  // then we need sentTxEthPriceUsd:
  // const sentTxStartOfDayTs = getTimestampStartOfDayUTC(sentTx.timeStamp)
  // ethPricesUsd.find(([ts]) => ts === sentTxStartOfDayTs)
  // const [_ , sentTxEthPriceUsd] = ethPriceArr
}


const { ETH_ADDRESS } = process.env
if (!ETH_ADDRESS) {
  console.log('ETH_ADDRESS must be defined!')
  process.exit(0)
}

main(ETH_ADDRESS)