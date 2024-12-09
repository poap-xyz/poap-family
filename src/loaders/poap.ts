import { AbortedError, HttpError } from 'models/error'
import {
  parsePOAP,
  POAP_API_URL,
  POAP_API_KEY,
  POAP_FETCH_RETRIES,
  POAP,
} from 'models/poap'

/**
 * Fetch all POAP for given address.
 */
export async function scanAddress(address: string, abortSignal: AbortSignal): Promise<POAP[]> {
  let retries = 0
  let message: string | undefined

  do {
    let response
    try {
      response = await fetch(`${POAP_API_URL}/actions/scan/${address}`, {
        signal: abortSignal instanceof AbortSignal ? abortSignal : null,
        headers: {
          'x-api-key': POAP_API_KEY,
        },
      })
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') {
        throw new AbortedError(`Scan address aborted`)
      }

      console.error(err)

      if (retries >= POAP_FETCH_RETRIES) {
        message = String(err)
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
        } catch (err: unknown) {
          console.error(err)
        }

        if (message) {
          throw new HttpError(
            `Scan address failed (status ${response.status}): ${message}`,
            { status: response.status }
          )
        }

        throw new HttpError(
          `Scan address failed (status ${response.status})`,
          { status: response.status }
        )
      }

      retries++
      message = undefined
      continue
    }

    const tokens: unknown = await response.json()

    if (!tokens || !Array.isArray(tokens)) {
      throw new Error(`Invalid POAP response for scan`)
    }

    return tokens.map((token) => parsePOAP(token))
  } while (
    retries <= POAP_FETCH_RETRIES
  )

  // eslint-disable-next-line no-unreachable
  throw new Error(
    `Scan address failed (${retries} retries)${message ? `: ${message}` : ''}`
  )
}
