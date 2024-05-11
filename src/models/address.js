import { getAddress } from '@ethersproject/address'

export const PROFILE_EVENTS_LIMIT = 20

export const IGNORED_OWNERS = [
  '0x000000000000000000000000000000000000dead',
  '0x0000000000000000000000000000000000000000',
]

/**
 * @param {string} address
 * @returns {{
 *   address: string | null
 *   ens: string | null
 *   raw: string
 * }}
 */
export function parseAddress(address) {
  try {
    const parsedAddress = getAddress(address)
    return { address: parsedAddress, ens: null, raw: address }
  } catch (err) {
    return { address: null, ens: address, raw: address }
  }
}

/**
 * @param {string} addresses
 * @param {string} sep
 * @returns {ReturnType<parseAddress>[]}
 */
export function parseAddresses(addresses, sep = ',') {
  return addresses
    .split(sep)
    .map((address) => address.trim())
    .filter((address) => address.length > 0)
    .map((address) => parseAddress(decodeURIComponent(address)))
}
