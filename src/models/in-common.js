import { equals, intersection } from '../utils/array'

export const INCOMMON_EVENTS_LIMIT = 20
export const INCOMMON_ADDRESSES_LIMIT = 10

/**
 * Removes the ones that has one or zero in-common collectors and sorts it by
 * highest number of in-common collectors.
 *
 * @param {Record<number, string[]>} inCommon
 * @returns {Record<number, string[]>}
 */
export function filterAndSortInCommon(inCommon) {
  // With at least one in-common address.
  let entries = Object.entries(inCommon).filter(
    ([, addresses]) => addresses.length > 1
  )
  // Sorted by the highest in-common collectors.
  entries.sort(
    ([, aAddresses], [, bAddresses]) => bAddresses.length - aAddresses.length
  )
  return Object.fromEntries(entries)
}

/**
 * From a list of in-common objects, merge them into one in-common object. If
 * all is true then, collectors must be the same in all events to be included
 * or if not merges the partial collectors alltoguether.
 *
 * @param {Record<number, string[]>[]} allInCommon
 * @param {boolean} all
 * @returns {Record<number, string[]>}
 */
export function mergeAllInCommon(allInCommon, all = false) {
  const mergedInCommon = {}
  for (const inCommon of allInCommon) {
    for (const [inCommonEventId, addresses] of Object.entries(inCommon)) {
      if (inCommonEventId in mergedInCommon) {
        if (all) {
          if (!equals(mergedInCommon[inCommonEventId], addresses)) {
            delete mergedInCommon[inCommonEventId]
          }
        } else {
          mergedInCommon[inCommonEventId] = intersection(mergedInCommon[inCommonEventId], addresses)
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
 *
 * @param {Record<number, string[]>} inCommon
 * @returns {string[]}
 */
export function mergeAddressesInCommon(inCommon) {
  let mergedAddresses = null
  for (const [, addresses] of Object.entries(inCommon)) {
    if (mergedAddresses == null) {
      mergedAddresses = addresses
    } else {
      mergedAddresses = intersection(mergedAddresses, addresses)
    }
  }
  return mergedAddresses
}

/**
 * Retrieve a list of drops that the given {address} is found in the in-common
 * object.
 *
 * @param {Record<number, string[]>} inCommon
 * @param {string} address
 * @returns {number[]}
 */
export function getAddressInCommonEventIds(inCommon, address) {
  const eventIds = []
  for (const [rawEventId, addresses] of Object.entries(inCommon)) {
    if (addresses.indexOf(address) !== -1) {
      eventIds.push(parseInt(rawEventId))
    }
  }
  return eventIds
}
