import { parseEndOfDayDate } from 'utils/date'
import { Drop } from 'models/drop'

export const SEARCH_LIMIT = 10

export const DEFAULT_DROP_LIMIT = 100
export const DEFAULT_SEARCH_LIMIT = 10

export function parseEventIds(rawIds: string): number[] {
  let eventIds = (rawIds ?? '').split(',')
    .filter((value, index, all) => all.indexOf(value) === index)
    .map((value) => parseInt(value.trim()))
    .filter((eventId) => !isNaN(eventId))
  eventIds.sort((a, b) => a - b)
  return eventIds
}

export function joinEventIds(eventIds: number[]): string {
  return parseEventIds(eventIds.join(',')).join(',')
}

export function parseExpiryDates(events: Record<number, Drop>): Record<number, Date> {
  return Object.fromEntries(
    Object.entries(events)
      .map(
        ([eventId, event]) => ([
          eventId,
          event?.expiry_date
            ? parseEndOfDayDate(event.expiry_date)
            : undefined,
        ])
      )
      .filter(([, endOfDayDate]) => endOfDayDate != null)
  )
}

export function encodeExpiryDates(expiryDates: Record<number, Date | undefined>): string {
  if (typeof expiryDates !== 'object') {
    return ''
  }
  return Object.entries(expiryDates)
    .map(
      ([eventId, expiryDate]) => {
        if (!(expiryDate instanceof Date) || isNaN(expiryDate.getTime())) {
          return null
        }
        const ts = Math.trunc(expiryDate.getTime() / 1000)
        return `expiry[${encodeURIComponent(eventId)}]=${encodeURIComponent(ts)}`
      }
    )
    .filter((param) => param != null)
    .join('&')
}
