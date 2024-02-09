function Event(event) {
  return {
    id: event.id,
    name: event.name,
    image_url: event.image_url,
    city: event.city,
    country: event.country,
    start_date: event.start_date,
    end_date: event.end_date,
    expiry_date: event.expiry_date,
  }
}

function filterCacheEventsByInCommonEventIds(events, inCommonEventIds) {
  return Object.fromEntries(
    Object.entries(events).filter(
      ([eventId, inCommonEvent]) => inCommonEventIds.indexOf(String(inCommonEvent.id)) !== -1
    )
  )
}

function parseEventIds(rawIds) {
  let eventIds = (rawIds ?? '').split(',')
    .filter((value, index, all) => all.indexOf(value) === index)
    .map((value) => parseInt(value.trim()))
    .filter((eventId) => !isNaN(eventId))
  eventIds.sort((a, b) => a - b)
  return eventIds
}

function joinEventIds(eventIds) {
  return parseEventIds(eventIds.join(',')).join(',')
}

function parseExpiryDates(events) {
  return Object.fromEntries(
    Object.entries(events).map(
      ([eventId, event]) => ([
        eventId,
        event?.expiry_date
          ? new Date(event.expiry_date.replace(/-/g, '/') + ' 23:59:00 UTC')
          : undefined,
      ])
    )
  )
}

function encodeExpiryDates(expiryDates) {
  if (typeof expiryDates !== 'object') {
    return ''
  }
  return Object.entries(expiryDates)
    .map(
      ([eventId, expiryDate]) => `expiry[${encodeURIComponent(eventId)}]=${encodeURIComponent(Math.trunc(expiryDate.getTime() / 1000))}`
    )
    .join('&')
}

const SEARCH_LIMIT = 10

export {
  Event,
  filterCacheEventsByInCommonEventIds,
  parseEventIds,
  joinEventIds,
  parseExpiryDates,
  encodeExpiryDates,
  SEARCH_LIMIT,
}
