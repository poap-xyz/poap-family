import { getAddress } from '@ethersproject/address'

function parseAddresses(addresses, sep = ',') {
  return addresses
    .split(sep)
    .map((address) => address.trim())
    .filter((address) => address.length > 0)
    .map((address) => parseAddress(decodeURIComponent(address)))
}

function parseAddress(address) {
  try {
    const parsedAddress = getAddress(address)
    return { address: parsedAddress, ens: null, raw: address }
  } catch (err) {
    return { address: null, ens: address, raw: address }
  }
}

const PROFILE_EVENTS_LIMIT = 20

const IGNORED_OWNERS = [
  '0x000000000000000000000000000000000000dead',
  '0x0000000000000000000000000000000000000000',
]

export {
  parseAddresses,
  parseAddress,
  PROFILE_EVENTS_LIMIT,
  IGNORED_OWNERS,
}
