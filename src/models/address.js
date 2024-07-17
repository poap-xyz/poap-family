import { normalizeAddress } from 'utils/ethereum'

export const IGNORED_OWNERS = [
  '0x000000000000000000000000000000000000dEaD',
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
  if (
    address.startsWith('0x') &&
    address.length === 42 &&
    !address.includes('.')
  ) {
    return { address: normalizeAddress(address), ens: null, raw: address }
  } else {
    return { address: null, ens: address, raw: address }
  }
}

/**
 * @param {string} rawAddresses
 * @param {string} sep
 * @returns {ReturnType<parseAddress>[]}
 */
export function parseAddresses(rawAddresses, sep = ',') {
  return rawAddresses
    .split(sep)
    .map((address) => address.trim())
    .filter((address) => address.length > 0)
    .map((address) => parseAddress(decodeURIComponent(address)))
}

/**
 * Keep the addresses that appear only once in the array and are not included
 * in the list of ignored.
 *
 * @param {string[]} addresses
 * @returns {string[]}
 */
export function filterInvalidOwners(addresses) {
  return addresses
    .map((address) => parseAddress(address).address)
    .filter(
      (address, index, all) => (
        address &&
        all.indexOf(address) === index &&
        !IGNORED_OWNERS.includes(address)
      )
    )
}
