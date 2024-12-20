import { equals, intersection } from 'utils/array'
import {
  areAddressesEqual,
  filterInvalidAddresses,
  isAddress,
} from 'models/address'

export const INCOMMON_DROPS_LIMIT = 20
export const INCOMMON_ADDRESSES_LIMIT = 10

export type InCommon = Record<number, string[]>

export function parseInCommon(inCommon: unknown): InCommon {
  if (
    inCommon == null ||
    typeof inCommon !== 'object' ||
    !Object.keys(inCommon)
      .map((rawDropId) => parseInt(rawDropId))
      .every((eventId) => eventId != null && !isNaN(eventId)) ||
    !Object.values(inCommon).every(
      (addresses: unknown): addresses is string[] =>
        addresses != null &&
        Array.isArray(addresses) &&
        addresses.every(
          (address: unknown): address is string => isAddress(address)
      )
    )
  ) {
    throw new Error('Invalid in common collectors by drop')
  }
  // @ts-ignore
  return inCommon
}

/**
 * Filter the collectors for invalid ones and then eemoves the ones that has one
 * or zero in-common collectors.
 */
export function filterInCommon(inCommon: InCommon): InCommon {
  if (typeof inCommon !== 'object') {
    return {}
  }
  // With at least one in-common address.
  return Object.fromEntries(
    Object.entries(inCommon)
      .map(([rawDropId, collectors]) => [
        rawDropId,
        filterInvalidAddresses(collectors),
      ])
      .filter(
        ([, addresses]) => addresses.length > 1
      )
  )
}

/**
 * Sorts it by highest number of in-common collectors.
 */
export function sortInCommonEntries(
  inCommonEntries: Array<[number, string[]]>,
): Array<[number, string[]]> {
  const copyInCommonEntries = inCommonEntries.slice()
  // Sorted by the highest in-common collectors.
  copyInCommonEntries.sort(
    ([, aAddresses], [, bAddresses]) => bAddresses.length - aAddresses.length
  )
  return copyInCommonEntries
}

/**
 * From a list of in-common objects, merge them into one in-common object. If
 * all is true then, collectors must be the same in all drops to be included
 * or if not merges the partial collectors alltoguether.
 */
export function mergeAllInCommon(
  allInCommon: InCommon[],
  all: boolean = false,
): InCommon {
  const mergedInCommon: InCommon = {}
  for (const inCommon of allInCommon) {
    for (const [inCommonEventId, addresses] of Object.entries(inCommon)) {
      if (inCommonEventId in mergedInCommon) {
        if (all) {
          if (!equals(mergedInCommon[inCommonEventId], addresses)) {
            delete mergedInCommon[inCommonEventId]
          }
        } else {
          mergedInCommon[inCommonEventId] = intersection(
            mergedInCommon[inCommonEventId],
            addresses
          )
        }
      } else {
        mergedInCommon[inCommonEventId] = addresses
      }
    }
  }
  return mergedInCommon
}

/**
 * Merges in-common collectors that belong to all drops.
 */
export function mergeAddressesInCommon(inCommon: InCommon): string[] {
  let mergedAddresses: string[] | null = null
  for (const [, addresses] of Object.entries(inCommon)) {
    if (mergedAddresses == null) {
      mergedAddresses = addresses
    } else {
      mergedAddresses = intersection(mergedAddresses, addresses)
    }
  }
  return mergedAddresses ?? []
}

/**
 * Retrieve a list of drops that the given {address} is found in the in-common
 * object.
 */
export function getAddressInCommonDropIds(
  inCommon: InCommon,
  address: string,
): number[] {
  const dropIds: number[] = []
  for (const [rawDropId, addresses] of Object.entries(inCommon)) {
    if (addresses.indexOf(address) !== -1) {
      const dropId = parseInt(rawDropId)
      if (!isNaN(dropId)) {
        dropIds.push(dropId)
      }
    }
  }
  return dropIds
}

/**
 * Given the list of drops that the address has in common, retrieve all other
 * addresses that share the same drops. The given {dropIds} must be the
 * result of `getAddressInCommonEventIds(inCommon, address)`.
 */
export function getAddressInCommonAddresses(
  inCommon: InCommon,
  dropIds: number[],
  address: string,
): string[] {
  if (dropIds.length < 2) {
    return []
  }
  return mergeAddressesInCommon(
    Object.fromEntries(
      Object.entries(inCommon).filter(
        ([inCommonDropId]) => {
          const dropId = parseInt(inCommonDropId)
          if (isNaN(dropId)) {
            return false
          }
          return dropIds.includes(dropId)
        }
      )
    )
  ).filter(
    (inCommonAddress) => areAddressesEqual(inCommonAddress, address)
  )
}
