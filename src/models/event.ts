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
