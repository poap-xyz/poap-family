import { InfuraProvider } from '@ethersproject/providers'
import { Contract } from '@ethersproject/contracts'
import {
  INFURA_API_KEY,
  MAINNET_ENS_REVERSE_RECORDS,
  ENS_REVERSE_RECORDS_BATCH_SIZE,
} from '../models/ethereum'

const ensProvider = new InfuraProvider('mainnet', INFURA_API_KEY)
const ensReverseRecordsContract = new Contract(
  MAINNET_ENS_REVERSE_RECORDS,
  [
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
  ],
  ensProvider
)

async function resolveEnsNames(
  addresses,
  onProgress = (resolved) => {},
  limit = ENS_REVERSE_RECORDS_BATCH_SIZE
) {
  const resolvedAddresses = {}
  for (let i = 0; i < addresses.length; i += limit) {
    const chunk = addresses.slice(i, i + limit)
    try {
      const names = await ensReverseRecordsContract.getNames(chunk)
      const resolved = {}
      for (let i = 0; i < names.length; i++) {
        if (names[i] !== '') {
          resolvedAddresses[chunk[i]] = names[i]
          resolved[chunk[i]] = names[i]
        }
      }
      if (Object.keys(resolved).length > 0) {
        onProgress(resolved)
      }
    } catch (err) {
      i = i - limit + 1
      continue
    }
  }
  return resolvedAddresses
}

async function resolveAddress(ensName) {
  return await ensProvider.resolveName(ensName)
}

async function resolveEnsAvatar(ensName) {
  return await ensProvider.getAvatar(ensName)
}

export { resolveEnsNames, resolveAddress, resolveEnsAvatar }
