import PropTypes from 'prop-types'

export const FAMILY_API_URL = process.env.REACT_APP_FAMILY_API_URL ?? 'https://api.poap.family'
export const FAMILY_API_KEY = process.env.REACT_APP_FAMILY_API_KEY

/**
 * @param {unknown} inCommon
 * @returns {Record<number, string[]>}
 */
export function InCommon(inCommon) {
  if (
    inCommon == null ||
    typeof inCommon !== 'object' ||
    !Object.keys(inCommon)
      .map((rawEventId) => parseInt(rawEventId))
      .every((eventId) => eventId != null && !isNaN(eventId)) ||
    !Object.values(inCommon).every((addresses) =>
      addresses != null &&
      Array.isArray(addresses) &&
      addresses.every((address) =>
        address != null &&
        typeof address === 'string'
      )
    )
  ) {
    throw new Error('Invalid in common collectors by drop')
  }
  // @ts-ignore
  return inCommon
}

/**
 * @param {unknown} cachedEvent
 * @returns {{
 *   id: number
 *   name: string
 *   image_url: string
 *   cached_ts: number
 *   in_common_count: number
 * }}
 */
export function CachedEvent(cachedEvent) {
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

export const CachedEventProps = {
  id: PropTypes.number.isRequired,
  name: PropTypes.string.isRequired,
  image_url: PropTypes.string.isRequired,
  cached_ts: PropTypes.number.isRequired,
  in_common_count: PropTypes.number.isRequired,
}
