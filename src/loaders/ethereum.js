import { CloudflareProvider, InfuraProvider } from '@ethersproject/providers'
import { Contract } from '@ethersproject/contracts'
import { INFURA_API_KEY, MAINNET_ENS_REVERSE_RECORDS } from '../models/ethereum'

function getMainnetProvider() {
  return new CloudflareProvider('mainnet')
}

function getMainnetEnsProvider() {
  return new InfuraProvider('mainnet', INFURA_API_KEY)
}

function getMainnetEnsReverseRecordsABI() {
  return [
    {
      inputs: [{ internalType: 'contract ENS', name: '_ens', type: 'address' }],
      stateMutability: 'nonpayable',
      type: 'constructor',
    },
    {
      inputs: [{ internalType: 'address[]', name: 'addresses', type: 'address[]' }],
      name: 'getNames',
      outputs: [{ internalType: 'string[]', name: 'r', type: 'string[]' }],
      stateMutability: 'view',
      type: 'function',
    },
  ]
}

function getMainnetEnsReverseRecordsContract() {
  return new Contract(
    MAINNET_ENS_REVERSE_RECORDS,
    getMainnetEnsReverseRecordsABI(),
    getMainnetEnsProvider()
  )
}

const ensReverseRecordsContract = getMainnetEnsReverseRecordsContract()

async function resolveEnsNames(addresses, limit = 300) {
  const resolvedAddresses = {}
  for (let i = 0; i < addresses.length; i += limit) {
    const chunk = addresses.slice(i, i + limit)
    try {
      const names = await ensReverseRecordsContract.getNames(chunk)
      for (let i = 0; i < names.length; i++) {
        if (names[i] !== '') {
          resolvedAddresses[chunk[i]] = names[i]
        }
      }
    } catch (err) {
      i = i - limit + 1
      continue
    }
  }
  return resolvedAddresses
}

const provider = getMainnetProvider()

async function resolveAddress(ensName) {
  return await provider.resolveName(ensName)
}

export { resolveEnsNames, resolveAddress }
