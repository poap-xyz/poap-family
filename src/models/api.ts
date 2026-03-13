import { InCommon } from 'models/in-common'

export const FAMILY_API_URL = process.env.REACT_APP_FAMILY_API_URL ?? 'https://api.poap.family'
export const FAMILY_API_KEY = process.env.REACT_APP_FAMILY_API_KEY

export interface EventsInCommon {
  inCommon: InCommon
}

export interface EventInCommonCount {
  id: number
  in_common_count: number
}

export function parseEventInCommonCount(event: unknown): EventInCommonCount {
  if (
    event == null ||
    typeof event !== 'object' ||
    !('id' in event) ||
    event.id == null ||
    typeof event.id !== 'number' ||
    !('in_common_count' in event) ||
    event.in_common_count == null ||
    typeof event.in_common_count !== 'number'
  ) {
    throw new Error('Invalid cached drop')
  }
  return {
    id: event.id,
    in_common_count: event.in_common_count,
  }
}
