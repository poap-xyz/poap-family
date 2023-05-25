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
    event: !token.event ? undefined : Event(token.event),
  }
}

const POAP_SCAN_URL = 'https://app.poap.xyz/scan'

export {
  POAP_FETCH_RETRIES,
  POAP_API_URL,
  POAP_API_KEY,
  POAP,
  POAP_SCAN_URL,
}
