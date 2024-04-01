import { equals, intersection } from '../utils/array'

function filterAndSortInCommon(inCommonEntries) {
  let entries = inCommonEntries.filter(([eventId, addresses]) => addresses.length > 1)
  entries.sort(
    ([aEventId, aAddresses], [bEventId, bAddresses]) => bAddresses.length - aAddresses.length
  )
  return entries
}

function mergeEventsInCommon(eventData, all = false) {
  const allInCommon = {}
  for (const [, { inCommon }] of Object.entries(eventData)) {
    for (const [inCommonEventId, addresses] of Object.entries(inCommon)) {
      if (inCommonEventId in allInCommon) {
        if (all) {
          if (!equals(allInCommon[inCommonEventId], addresses)) {
            delete allInCommon[inCommonEventId]
          }
        } else {
          allInCommon[inCommonEventId] = intersection(allInCommon[inCommonEventId], addresses)
        }
      } else {
        allInCommon[inCommonEventId] = addresses
      }
    }
  }
  return allInCommon
}

function mergeAddressesInCommon(inCommonEntries) {
  let mergedAddresses = null
  for (const [, addresses] of inCommonEntries) {
    if (mergedAddresses == null) {
      mergedAddresses = addresses
    } else {
      mergedAddresses = intersection(mergedAddresses, addresses)
    }
  }
  return mergedAddresses
}

function getAddressInCommonEventIds(inCommonEntries, address) {
  const eventIds = []
  for (const [eventId, addresses] of inCommonEntries) {
    if (addresses.indexOf(address) !== -1) {
      eventIds.push(eventId)
    }
  }
  return eventIds
}

const INCOMMON_EVENTS_LIMIT = 20
const INCOMMON_ADDRESSES_LIMIT = 10

export {
  filterAndSortInCommon,
  mergeEventsInCommon,
  mergeAddressesInCommon,
  getAddressInCommonEventIds,
  INCOMMON_EVENTS_LIMIT,
  INCOMMON_ADDRESSES_LIMIT,
}
