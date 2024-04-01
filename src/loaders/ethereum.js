import { StaticJsonRpcProvider } from '@ethersproject/providers'
import { Contract } from '@ethersproject/contracts'
import {
  MAINNET_PROVIDER_URL,
  MAINNET_ENS_REVERSE_RECORDS,
  ENS_REVERSE_RECORDS_BATCH_SIZE,
  ENS_RESOLVE_MAX_ERRORS,
} from '../models/ethereum'

const ensProvider = new StaticJsonRpcProvider(MAINNET_PROVIDER_URL, 'mainnet')
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
  limit = ENS_REVERSE_RECORDS_BATCH_SIZE,
  maxErrors = ENS_RESOLVE_MAX_ERRORS,
) {
  const resolvedAddresses = {}
  let errorsTotal = 0
  let errors = 0
  for (let i = 0; i < addresses.length; i += limit) {
    const resolved = {}
    let chunk = addresses.slice(i, i + limit)
    try {
      let names = await ensReverseRecordsContract.getNames(chunk)
      if (errors > 0) {
        const errorsChunk = addresses.slice(i - errors, i - 1)
        try {
          const errorsNames = await ensReverseRecordsContract.getNames(errorsChunk)
          chunk = [...errorsChunk, ...chunk]
          names = [...errorsNames, ...names]
        } catch (err) {
          console.error('resolveEnsNames', err)
        }
      }
      errors = 0
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
      errorsTotal += 1
      errors += 1
      if (errorsTotal > maxErrors) {
        console.error('resolveEnsNames', err)
        throw new Error(
          'Cannot continue retrieving ENS names as the maximum number of error was reached'
        )
      }
      i = i - limit + 1
      continue
    }
  }
  return resolvedAddresses
}

async function resolveAddress(ensName) {
  try {
    return await ensProvider.resolveName(ensName)
  } catch {
    return null
  }
}

async function resolveEnsAvatar(ensNameOrAddress) {
  try {
    return await ensProvider.getAvatar(ensNameOrAddress)
  } catch {
    return null
  }
}

export { resolveEnsNames, resolveAddress, resolveEnsAvatar }
