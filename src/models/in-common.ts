import { equals, intersection } from 'utils/array'
import { filterInvalidOwners } from 'models/address'
import { InCommon } from 'models/api'

export const INCOMMON_EVENTS_LIMIT = 20
export const INCOMMON_ADDRESSES_LIMIT = 10

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
      .map(([eventId, owners]) => [eventId, filterInvalidOwners(owners)])
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
 * all is true then, collectors must be the same in all events to be included
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
 * Merges in-common collectors that belong to all events.
 */
export function mergeAddressesInCommon(inCommon: InCommon): string[] {
  let mergedAddresses = null
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
export function getAddressInCommonEventIds(
  inCommon: InCommon,
  address: string,
): number[] {
  const eventIds = []
  for (const [rawEventId, addresses] of Object.entries(inCommon)) {
    if (addresses.indexOf(address) !== -1) {
      eventIds.push(parseInt(rawEventId))
    }
  }
  return eventIds
}

/**
 * Given the list of events that the address has in common, retrieve all other
 * addresses that share the same events. The given {eventIds} must be the
 * result of `getAddressInCommonEventIds(inCommon, address)`.
 */
export function getAddressInCommonAddresses(
  inCommon: InCommon,
  eventIds: number[],
  address: string,
): string[] {
  if (eventIds.length < 2) {
    return []
  }
  return mergeAddressesInCommon(
    Object.fromEntries(
      Object.entries(inCommon).filter(
        ([inCommonEventId]) => eventIds.includes(parseInt(inCommonEventId))
      )
    )
  ).filter(
    (inCommonAddress) => inCommonAddress.toLowerCase() !== address.toLowerCase()
  )
}
