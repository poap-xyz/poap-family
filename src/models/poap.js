import { Event } from './event'

const POAP_FETCH_RETRIES = 5

const POAP_API_URL = process.env.REACT_APP_POAP_API_URL ?? 'https://api.poap.tech'
const POAP_API_KEY = process.env.REACT_APP_POAP_API_KEY

function POAP(token) {
  return {
    id: token.tokenId,
    owner: {
      id: typeof token.owner === 'object' ? token.owner.id : token.owner,
    },
    created: !token.created ? undefined : new Date(token.created),
    event: !token.event ? undefined : Event(token.event),
  }
}

const POAP_SCAN_URL = 'https://app.poap.xyz/scan'
const POAP_GALLERY_URL = 'https://poap.gallery/event'
const POAP_MOMENTS_URL = 'https://moments.poap.xyz'
const POAP_COLLECTIONS_URL = 'https://collections.poap.xyz'

function findInitialPOAPDate(tokens) {
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

export {
  POAP_FETCH_RETRIES,
  POAP_API_URL,
  POAP_API_KEY,
  POAP,
  POAP_SCAN_URL,
  POAP_GALLERY_URL,
  POAP_MOMENTS_URL,
  POAP_COLLECTIONS_URL,
  findInitialPOAPDate,
}
