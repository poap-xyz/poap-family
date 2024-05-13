import { parseEndOfDayDate } from '../utils/date'

export const SEARCH_LIMIT = 10

export const DEFAULT_SEARCH_LIMIT = 10

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
