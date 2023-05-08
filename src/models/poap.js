import { Event } from './event'

const POAP_FETCH_RETRIES = 5

const POAP_API_URL = process.env.REACT_APP_POAP_API_URL ?? 'https://api.poap.tech'
const POAP_API_KEY = process.env.REACT_APP_POAP_API_KEY

function POAP(poap) {
  return {
    id: poap.id,
    owner: {
      id: poap.owner.id,
    },
    event: !poap.event ? undefined : Event(poap.event),
  }
}

export { POAP_FETCH_RETRIES, POAP_API_URL, POAP_API_KEY, POAP }
