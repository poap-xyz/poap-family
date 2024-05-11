import { Event } from './event'

export const POAP_API_URL = process.env.REACT_APP_POAP_API_URL ?? 'https://api.poap.tech'
export const POAP_API_KEY = process.env.REACT_APP_POAP_API_KEY

export const POAP_SCAN_URL = 'https://app.poap.xyz/scan'
export const POAP_GALLERY_URL = 'https://poap.gallery/event'
export const POAP_MOMENTS_URL = 'https://moments.poap.xyz'
export const POAP_COLLECTIONS_URL = 'https://collections.poap.xyz'

export const POAP_FETCH_RETRIES = 5

/**
 * @param {unknown} token
 * @returns {{
 *   id: number
 *   owner: {
 *     id: string
 *   }
 *   created?: Date
 *   event?: ReturnType<Event>
 * }}
 */
export function POAP(token) {
  return {
    id: token.tokenId,
    owner: {
      id: typeof token.owner === 'object' ? token.owner.id : token.owner,
    },
    created: !token.created ? undefined : new Date(token.created),
    event: !token.event ? undefined : Event(token.event),
  }
}

/**
 * Finds the first created date on a list of POAPs.
 *
 * @param {ReturnType<POAP>[]} tokens
 * @returns {Date | null}
 */
export function findInitialPOAPDate(tokens) {
  return tokens.reduce(
    (initialDate, token) => {
      if (
        token &&
        token.created &&
        token.created instanceof Date &&
        (
          initialDate === null ||
          (
            initialDate instanceof Date &&
            initialDate > token.created
          )
        )
      ) {
        return token.created
      }
      return initialDate
    },
    null
  )
}
