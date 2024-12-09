import { getAddress as ethereumGetAddress } from '@ethersproject/address'

export function normalizeAddress(address: string): string | null {
  try {
    return getAddress(address)
  } catch {
    return null
  }
}

export function getAddress(address: string): string {
  return ethereumGetAddress(address)
}
