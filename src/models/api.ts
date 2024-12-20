import { Drop } from 'models/drop'
import { InCommon } from 'models/in-common'

export const FAMILY_API_URL = process.env.REACT_APP_FAMILY_API_URL ?? 'https://api.poap.family'
export const FAMILY_API_KEY = process.env.REACT_APP_FAMILY_API_KEY

export interface EventsInCommon {
  events: Record<number, Drop>
  inCommon: InCommon
  ts: number | null
}

export interface CachedEvent {
  id: number
  name: string
  image_url: string
  cached_ts: number
  in_common_count: number
}

export function parseCachedEvent(cachedEvent: unknown): CachedEvent {
  if (
    cachedEvent == null ||
    typeof cachedEvent !== 'object' ||
    !('id' in cachedEvent) ||
    cachedEvent.id == null ||
    typeof cachedEvent.id !== 'number' ||
    !('name' in cachedEvent) ||
    cachedEvent.name == null ||
    typeof cachedEvent.name !== 'string' ||
    !('image_url' in cachedEvent) ||
    cachedEvent.image_url == null ||
    typeof cachedEvent.image_url !== 'string' ||
    !('cached_ts' in cachedEvent) ||
    cachedEvent.cached_ts == null ||
    typeof cachedEvent.cached_ts !== 'number' ||
    !('in_common_count' in cachedEvent) ||
    cachedEvent.in_common_count == null ||
    typeof cachedEvent.in_common_count !== 'number'
  ) {
    throw new Error('Invalid cached drop')
  }
  return {
    id: cachedEvent.id,
    name: cachedEvent.name,
    image_url: cachedEvent.image_url,
    cached_ts: cachedEvent.cached_ts,
    in_common_count: cachedEvent.in_common_count,
  }
}

export interface Feedback {
  id: number
  message: string
  location: string
  ts: number
}
