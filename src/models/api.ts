import { InCommon } from 'models/in-common'

export const FAMILY_API_URL = process.env.REACT_APP_FAMILY_API_URL ?? 'https://api.poap.family'
export const FAMILY_API_KEY = process.env.REACT_APP_FAMILY_API_KEY

export interface EventsInCommon {
  inCommon: InCommon
  ts: number | null
}

export interface EventInCommonCount {
  id: number
  cached_ts: number | null
  in_common_count: number
}

export function parseEventInCommonCount(cachedEvent: unknown): EventInCommonCount {
  if (
    cachedEvent == null ||
    typeof cachedEvent !== 'object' ||
    !('id' in cachedEvent) ||
    cachedEvent.id == null ||
    typeof cachedEvent.id !== 'number' ||
    !('cached_ts' in cachedEvent) ||
    !('in_common_count' in cachedEvent) ||
    cachedEvent.in_common_count == null ||
    typeof cachedEvent.in_common_count !== 'number'
  ) {
    throw new Error('Invalid cached drop')
  }
  return {
    id: cachedEvent.id,
    cached_ts: (
        cachedEvent.cached_ts != null &&
        typeof cachedEvent.cached_ts === 'number'
      )
        ? cachedEvent.cached_ts
        : null,
    in_common_count: cachedEvent.in_common_count,
  }
}
