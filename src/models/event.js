function Event(event) {
  return {
    id: event.id,
    name: event.name,
    image_url: event.image_url,
    original_url: event.original_url
      ?? event.drop_image?.gateways?.reduce(
        (original, gateway) => gateway.type === 'ORIGINAL' ? gateway.url : original,
        event.image_url
      )
      ?? event.image_url,
    city: event.city,
    country: event.country,
    start_date: event.start_date,
    end_date: event.end_date,
    expiry_date: event.expiry_date,
  }
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
      ([eventId, expiryDate]) => {
        if (!(expiryDate instanceof Date) || isNaN(expiryDate.getTime())) {
          return null
        }
        return `expiry[${encodeURIComponent(eventId)}]=${encodeURIComponent(Math.trunc(expiryDate.getTime() / 1000))}`
      }
    )
    .filter((param) => param != null)
    .join('&')
}

const SEARCH_LIMIT = 10

export {
  Event,
  parseEventIds,
  joinEventIds,
  parseExpiryDates,
  encodeExpiryDates,
  SEARCH_LIMIT,
}
