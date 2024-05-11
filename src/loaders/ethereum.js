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
      inputs: [
        { internalType: 'contract ENS', name: '_ens', type: 'address' },
      ],
      stateMutability: 'nonpayable',
      type: 'constructor',
    },
    {
      inputs: [
        { internalType: 'address[]', name: 'addresses', type: 'address[]' },
      ],
      name: 'getNames',
      outputs: [
        { internalType: 'string[]', name: 'r', type: 'string[]' },
      ],
      stateMutability: 'view',
      type: 'function',
    },
  ],
  ensProvider
)

/**
 * @param {string[]} addresses
 * @param {(resolved: Record<string, string>) => void} onProgress
 * @param {number} limit
 * @param {number} maxErrors
 * @returns {Record<string, string>}
 */
export async function resolveEnsNames(
  addresses,
  onProgress = (resolved) => {},
  limit = ENS_REVERSE_RECORDS_BATCH_SIZE,
  maxErrors = ENS_RESOLVE_MAX_ERRORS,
) {
  /**
   * @type {Record<string, string>}
   */
  const resolvedAddresses = {}

  let errorsTotal = 0
  let errors = 0

  for (let i = 0; i < addresses.length; i += limit) {
    let chunk = addresses.slice(i, i + limit)

    /**
     * @type {Record<string, string>}
     */
    const resolvedInChunk = {}

    try {
      let names = await ensReverseRecordsContract.getNames(chunk)
      if (errors > 0) {
        const errorsChunk = addresses.slice(i - errors, i - 1)
        try {
          const errorsNames = await ensReverseRecordsContract.getNames(errorsChunk)
          chunk = [...errorsChunk, ...chunk]
          names = [...errorsNames, ...names]
        } catch (err) {
          console.error(err)
        }
      }

      errors = 0
      for (let e = 0; e < names.length; e++) {
        if (names[e] !== '') {
          resolvedAddresses[chunk[e]] = names[e]
          resolvedInChunk[chunk[e]] = names[e]
        }
      }

      if (Object.keys(resolvedInChunk).length > 0) {
        onProgress(resolvedInChunk)
      }
    } catch (err) {
      errorsTotal += 1
      errors += 1

      if (errorsTotal > maxErrors) {
        console.error(err)
        throw new Error(
          'Cannot continue retrieving ENS names as the ' +
          'maximum number of errors was reached'
        )
      }

      i = i - limit + 1
      continue
    }
  }

  return resolvedAddresses
}

/**
 * @param {string} ensName
 * @returns {string | null}
 */
export async function resolveAddress(ensName) {
  try {
    return await ensProvider.resolveName(ensName)
  } catch {
    return null
  }
}

/**
 * @param {string} ensNameOrAddress
 * @returns {string | null}
 */
export async function resolveEnsAvatar(ensNameOrAddress) {
  try {
    return await ensProvider.getAvatar(ensNameOrAddress)
  } catch {
    return null
  }
}
