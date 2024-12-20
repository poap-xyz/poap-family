import { normalizeAddress } from 'utils/ethereum'

export const IGNORED_ADDRESSES = [
  '0x000000000000000000000000000000000000dEaD',
  '0x000000000000000000000000000000000000dead',
  '0x0000000000000000000000000000000000000000',
]

export function isAddress(address: unknown): address is string {
  return (
    address != null &&
    typeof address === 'string' &&
    address.startsWith('0x') &&
    address.length === 42 &&
    !address.includes('.')
  )
}

export function areAddressesEqual(
  leftAddress: string,
  rightAddress: string,
): boolean {
  return String(leftAddress).toLowerCase() === String(rightAddress).toLowerCase()
}

export interface ParsedAddress {
  address: string | null
  ens: string | null
  raw: string
}

export function parseAddress(address: string): ParsedAddress {
  if (isAddress(address)) {
    return { address: normalizeAddress(address), ens: null, raw: address }
  } else {
    return { address: null, ens: address, raw: address }
  }
}

export function parseAddresses(rawAddresses: string, sep: string = ','): ParsedAddress[] {
  return rawAddresses
    .split(sep)
    .map((address) => address.trim())
    .filter((address) => address.length > 0)
    .map((address) => parseAddress(decodeURIComponent(address)))
}

/**
 * Keep the addresses that appear only once in the array and are not included
 * in the list of ignored.
 */
export function filterInvalidAddresses(addresses: string[]): string[] {
  return addresses
    .map((address) => parseAddress(address).address)
    .filter(
      (address, index, all) => (
        address != null &&
        all.indexOf(address) === index &&
        !IGNORED_ADDRESSES.includes(address)
      )
    )
}
