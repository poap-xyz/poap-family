import { StaticJsonRpcProvider } from '@ethersproject/providers'
import { Contract } from '@ethersproject/contracts'
import {
  MAINNET_PROVIDER_URL,
  MAINNET_ENS_REVERSE_RECORDS,
  ENS_REVERSE_RECORDS_BATCH_SIZE,
  ENS_RESOLVE_MAX_ERRORS,
} from 'models/ethereum'

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

export async function resolveEnsNames(
  addresses: string[],
  onProgress: (resolved: Record<string, string>) => void = (resolved) => {},
  limit: number = ENS_REVERSE_RECORDS_BATCH_SIZE,
  maxErrors: number = ENS_RESOLVE_MAX_ERRORS,
): Promise<Record<string, string>> {
  const resolvedAddresses: Record<string, string> = {}

  let errorsTotal = 0
  let errors = 0

  for (let i = 0; i < addresses.length; i += limit) {
    let chunk = addresses.slice(i, i + limit)
    const resolvedInChunk: Record<string, string> = {}

    try {
      let names = await ensReverseRecordsContract.getNames(chunk)
      if (errors > 0) {
        const errorsChunk = addresses.slice(i - errors, i - 1)
        try {
          const errorsNames = await ensReverseRecordsContract.getNames(errorsChunk)
          chunk = [...errorsChunk, ...chunk]
          names = [...errorsNames, ...names]
        } catch (err: unknown) {
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
    } catch (err: unknown) {
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

export async function resolveAddress(ensName: string): Promise<string | null> {
  try {
    return await ensProvider.resolveName(ensName)
  } catch {
    return null
  }
}

export async function resolveEnsAvatar(ensNameOrAddress: string): Promise<string | null> {
  try {
    return await ensProvider.getAvatar(ensNameOrAddress)
  } catch {
    return null
  }
}
