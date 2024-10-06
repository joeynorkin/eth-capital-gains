import { EtherscanProvider, formatEther, Transaction } from 'ethers'
import { API_KEY, NETWORK } from '../constants/etherscanConstants'

// TODO: Possibly inject provider here initialize it somewhere else, maybe in its own file
export const etherscanProvider = new EtherscanProvider(NETWORK, API_KEY)

type AllString<T> = {
  [key in keyof T]: string
}

export type TransactionResponseType = AllString<Transaction> & { timeStamp: string }

export const getTransactions = async (ethAddress: string ) => {
  return await etherscanProvider.fetch('account', {
    action: 'txlist',
    address: ethAddress,
    startblock: 0,
    endblock: 99999999,
    page: 1,
    offset: 10,
    sort: 'asc',
  }) as TransactionResponseType[]
}

export const getCurrentEtherPrice = async () => await etherscanProvider.getEtherPrice()

/**
 * @param address
 * @returns Formatted eth balance in usd
 */
export const getEtherBalance = async (address: string) => formatEther(await etherscanProvider.getBalance(address))