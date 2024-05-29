import { getAddress } from '@ethersproject/address'

/**
 * @param {string} address
 * @returns {string | null}
 */
export function normalizeAddress(address) {
  try {
    return getAddress(address)
  } catch {
    return null
  }
}
