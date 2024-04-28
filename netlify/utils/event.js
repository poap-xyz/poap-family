import { formatDate } from './date.js'

export function encodeEvent(eventInfo) {
  const eventLocation = encodeLocation(eventInfo.event)
  return `${encodeMetrics(eventInfo)} ` +
    `${formatDate(eventInfo.event.start_date)} ` +
    (eventLocation ? `| ${eventLocation} ` : '') +
    `| ${shortDescription(eventInfo.event.description)}`
}

export function encodeMetrics(eventInfo) {
  const supply = eventInfo.owners?.length ?? 0
  const reservations = eventInfo.metrics?.emailReservations ?? 0

  return reservations > 0
    ? `[ ${supply} + ${reservations} ]`
    : `[ ${supply} ]`
}

export function encodeLocation(event) {
  return event.city && event.country
    ? `${event.city}, ${event.country}`
    : ''
}

export function shortDescription(description, n = 90) {
  if (typeof description !== 'string') {
    return '';
  }
  const p = description.split('\n').shift()
  if (p && p.length <= n) {
    return p
  }
  if (description.length > n) {
    return `${description.substring(0, n)}...`
  }
  return description
}
