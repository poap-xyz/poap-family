import { POAP, POAP_API_URL, POAP_API_KEY, POAP_FETCH_RETRIES } from '../models/poap'

async function fetchPOAPs(eventId, abortSignal, limit = 100) {
  let tokens = []
  let results = { total: 0, offset: 0, limit, tokens: [] }
  let retries = 0
  do {
    let response
    try {
      response = await fetch(
        `${POAP_API_URL}/event/${eventId}/poaps?offset=${results.offset}&limit=${results.limit}`,
        {
          signal: abortSignal instanceof AbortSignal ? abortSignal : null,
          headers: {
            'x-api-key': POAP_API_KEY,
          },
        }
      )
    } catch (err) {
      if (err.code === 20) {
        const aborted = new Error(`Fetch POAPs for '${eventId}' from ${results.offset} aborted`)
        aborted.aborted = true
        throw aborted
      }
      console.error(err)
      if (retries >= POAP_FETCH_RETRIES) {
        throw new Error(`Fetch POAPs for '${eventId}' from ${results.offset} failed: ${err.message}`)
      }
      retries++
      continue
    }
    if (response.status === 404) {
      return tokens
    }
    if (response.status !== 200) {
      if (retries >= POAP_FETCH_RETRIES) {
        let message
        try {
          const data = await response.json()
          if (typeof data === 'object' && 'message' in data) {
            message = data.message
          }
        } catch (err) {
          console.error(err)
        }
        if (message) {
          throw new Error(`Fetch POAPs for '${eventId}' from ${results.offset} failed (status ${response.status}): ${message}`)
        }
        throw new Error(`Fetch POAPs for '${eventId}' from ${results.offset} failed (status ${response.status})`)
      }
      retries++
      continue
    }
    results = await response.json()
    if (!results || typeof results !== 'object' || !('tokens' in results) || !Array.isArray(results.tokens)) {
      throw new Error(`Invalid POAP response for drop '${eventId}' from ${results.offset}`)
    }
    tokens = [...tokens, ...results.tokens.map((token) => POAP(token))]
    retries = 0
    if (results.tokens.length === 0) {
      break
    }
    results.offset += results.limit
  } while (tokens.length < results.total || results.total === 0)
  return tokens
}

async function scanAddress(address, abortSignal) {
  let retries = 0
  let message
  do {
    let response
    try {
      response = await fetch(`${POAP_API_URL}/actions/scan/${address}`, {
        signal: abortSignal instanceof AbortSignal ? abortSignal : null,
        headers: {
          'x-api-key': POAP_API_KEY,
        },
      })
    } catch (err) {
      if (err.code === 20) {
        const aborted = new Error(`Scan address aborted`)
        aborted.aborted = true
        throw aborted
      }
      console.error(err)
      if (retries >= POAP_FETCH_RETRIES) {
        message = err.message
        throw new Error(`Scan address failed: ${message}`)
      }
      retries++
      message = undefined
      continue
    }
    if (response.status !== 200) {
      if (retries >= POAP_FETCH_RETRIES) {
        try {
          const data = await response.json()
          if (typeof data === 'object' && 'message' in data) {
            message = data.message
          }
        } catch (err) {
          console.error(err)
        }
        if (message) {
          throw new Error(`Scan address failed (status ${response.status}): ${message}`)
        }
        throw new Error(`Scan address failed (status ${response.status})`)
      }
      retries++
      message = undefined
      continue
    }
    const tokens = await response.json()
    if (!tokens || !Array.isArray(tokens)) {
      throw new Error(`Invalid POAP response for scan`)
    }
    return tokens.map((token) => POAP(token))
  } while (retries <= POAP_FETCH_RETRIES)
  throw new Error(`Scan address failed (${retries} retries)${message ? `: ${message}` : ''}`) // eslint-disable-line no-unreachable
}

export { fetchPOAPs, scanAddress }
