import { parseEndOfDayDate } from '../utils/date'

export const SEARCH_LIMIT = 10

export const DEFAULT_SEARCH_LIMIT = 10

/**
 * @param {unknown} event
 * @param {boolean} includeDescription
 * @returns {{
 *   id: number
 *   name: string
 *   description?: string
 *   image_url: string
 *   original_url: string
 *   city: string | null
 *   country: string | null
 *   start_date: string
 *   end_date: string
 *   expiry_date: string
 * }}
 */
export function Event(event, includeDescription) {
  return {
    id: event.id,
    name: event.name,
    description: includeDescription ? event.description : undefined,
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

/**
 * @param {unknown} eventOwners
 * @returns {{
 *   owners: string[]
 *   ts: number
 * }}
 */
export function EventOwners(eventOwners) {
  if (eventOwners == null) {
    return null
  }
  if (
    typeof eventOwners !== 'object' ||
    !('owners' in eventOwners) ||
    !Array.isArray(eventOwners.owners) ||
    !('ts' in eventOwners) ||
    eventOwners.ts == null ||
    typeof eventOwners.ts !== 'number'
  ) {
    throw new Error('Malformed event owners')
  }
  return {
    owners: eventOwners.owners,
    ts: eventOwners.ts,
  }
}

/**
 * @param {unknown} eventMetrics
 * @returns {{
 *   emailReservations: number
 *   emailClaimsMinted: number
 *   emailClaims: number
 *   momentsUploaded: number
 *   collectionsIncludes: number
 *   ts: number
 * }}
 */
export function EventMetrics(eventMetrics) {
  if (eventMetrics == null) {
    return null
  }
  if (
    typeof eventMetrics !== 'object' ||
    !('emailReservations' in eventMetrics) ||
    typeof eventMetrics.emailReservations !== 'number' ||
    !('emailClaimsMinted' in eventMetrics) ||
    typeof eventMetrics.emailClaimsMinted !== 'number' ||
    !('emailClaims' in eventMetrics) ||
    typeof eventMetrics.emailClaims !== 'number' ||
    !('momentsUploaded' in eventMetrics) ||
    typeof eventMetrics.momentsUploaded !== 'number' ||
    !('collectionsIncludes' in eventMetrics) ||
    typeof eventMetrics.collectionsIncludes !== 'number' ||
    !('ts' in eventMetrics) ||
    typeof eventMetrics.ts !== 'number'
  ) {
    throw new Error('Malformed event metrics')
  }
  return {
    emailReservations: eventMetrics.emailReservations,
    emailClaimsMinted: eventMetrics.emailClaimsMinted,
    emailClaims: eventMetrics.emailClaims,
    momentsUploaded: eventMetrics.momentsUploaded,
    collectionsIncludes: eventMetrics.collectionsIncludes,
    ts: eventMetrics.ts,
  }
}

/**
 * @param {string} rawIds
 * @returns {number[]}
 */
export function parseEventIds(rawIds) {
  let eventIds = (rawIds ?? '').split(',')
    .filter((value, index, all) => all.indexOf(value) === index)
    .map((value) => parseInt(value.trim()))
    .filter((eventId) => !isNaN(eventId))
  eventIds.sort((a, b) => a - b)
  return eventIds
}

/**
 * @param {number[]} eventIds
 * @returns {string}
 */
export function joinEventIds(eventIds) {
  return parseEventIds(eventIds.join(',')).join(',')
}

/**
 * @param {Record<number, ReturnType<Event>>} events
 * @returns {Record<number, Date | undefined>}
 */
export function parseExpiryDates(events) {
  return Object.fromEntries(
    Object.entries(events).map(
      ([eventId, event]) => ([
        eventId,
        event?.expiry_date
          ? parseEndOfDayDate(event.expiry_date)
          : undefined,
      ])
    )
  )
}

/**
 * @param {Record<number, Date | undefined>} expiryDates
 * @returns {string}
 */
export function encodeExpiryDates(expiryDates) {
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
