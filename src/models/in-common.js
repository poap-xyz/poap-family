import { equals, intersection } from '../utils/array'

export const INCOMMON_EVENTS_LIMIT = 20
export const INCOMMON_ADDRESSES_LIMIT = 10

/**
 * Removes the ones that has one or zero in-common collectors.
 *
 * @param {Record<number, string[]>} inCommon
 * @returns {Record<number, string[]>}
 */
export function filterInCommon(inCommon) {
  if (typeof inCommon !== 'object') {
    return {}
  }
  // With at least one in-common address.
  return Object.fromEntries(
    Object.entries(inCommon).filter(
      ([, addresses]) => addresses.length > 1
    )
  )
}

/**
 * Sorts it by highest number of in-common collectors.
 *
 * @param {Array<[number, string[]]>} inCommonEntries
 * @returns {Array<[number, string[]]>}
 */
export function sortInCommonEntries(inCommonEntries) {
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
 *
 * @param {Record<number, string[]>[]} allInCommon
 * @param {boolean} all
 * @returns {Record<number, string[]>}
 */
export function mergeAllInCommon(allInCommon, all = false) {
  /**
   * @type {Record<number, string[]>}
   */
  const mergedInCommon = {}
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
  return mergedAddresses ?? []
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

/**
 * Given the list of events that the address has in common, retrieve all other
 * addresses that share the same events. The given {eventIds} must be the
 * result of `getAddressInCommonEventIds(inCommon, address)`.
 *
 * @param {Record<number, string[]>} inCommon
 * @param {number[]} eventIds
 * @param {string} address
 * @returns {string[]}
 */
export function getAddressInCommonAddresses(inCommon, eventIds, address) {
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
