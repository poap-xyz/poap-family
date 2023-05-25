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

const INCOMMON_EVENTS_LIMIT = 20

export {
  filterAndSortInCommon,
  mergeEventsInCommon,
  INCOMMON_EVENTS_LIMIT,
}
