import { getAddress } from '@ethersproject/address'

export function normalizeAddress(address: string): string | null {
  try {
    return getAddress(address)
  } catch {
    return null
  }
}
