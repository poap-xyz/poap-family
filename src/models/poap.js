import { Event } from './event'

export const POAP_API_URL = process.env.REACT_APP_POAP_API_URL ?? 'https://api.poap.tech'
export const POAP_API_KEY = process.env.REACT_APP_POAP_API_KEY

export const POAP_SCAN_URL = 'https://app.poap.xyz/scan'
export const POAP_GALLERY_URL = 'https://poap.gallery/event'
export const POAP_MOMENTS_URL = 'https://moments.poap.xyz'
export const POAP_COLLECTIONS_URL = 'https://collections.poap.xyz'

export const POAP_FETCH_RETRIES = 5
export const POAP_PROFILE_LIMIT = 20

/**
 * @param {unknown} token
 * @returns {{
 *   id: string
 *   owner: string
 *   created?: Date
 *   event?: ReturnType<Event>
 * }}
 */
export function POAP(token) {
  if (
    token == null ||
    typeof token !== 'object'
  ) {
    throw new Error('Invalid POAP')
  }

  /**
   * @type {string | undefined}
   */
  let tokenId
  if (
    'tokenId' in token &&
    token.tokenId != null && (
      typeof token.tokenId === 'number' ||
      typeof token.tokenId === 'string'
    )
  ) {
    tokenId = String(token.tokenId)
  } else if (
    'id' in token &&
    token.id != null && (
      typeof token.id === 'number' ||
      typeof token.id === 'string'
    )
  ) {
    tokenId = String(token.id)
  }
  if (tokenId == null) {
    throw new Error('Invalid POAP ID')
  }

  /**
   * @type {string | undefined}
   */
  let owner
  if (
    'owner' in token &&
    token.owner != null
  ) {
    if (
      typeof token.owner === 'object' &&
      'id' in token.owner &&
      token.owner.id != null &&
      typeof token.owner.id === 'string'
    ) {
      owner = token.owner.id
    } else if (typeof token.owner === 'string') {
      owner = token.owner
    }
  }
  if (owner == null) {
    throw new Error('Invalid POAP owner')
  }

  return {
    id: tokenId,
    owner,
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
