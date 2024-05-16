import axios from 'axios'
import { FAMILY_API_KEY, FAMILY_API_URL } from '../models/api'
import { encodeExpiryDates } from '../models/event'
import { Drop, DropMetrics, DropOwners } from '../models/drop'

/**
 * @param {number} eventId
 * @param {AbortSignal | undefined | null} abortSignal
 * @param {boolean} includeDescription
 * @param {boolean} includeMetrics
 * @param {boolean} refresh
 * @returns {Promise<{
 *   event: ReturnType<Drop>
 *   owners: string[]
 *   ts: number
 *   metrics: ReturnType<DropMetrics> | null
 * } | null>}
 */
export async function getEventAndOwners(
  eventId,
  abortSignal,
  includeDescription = false,
  includeMetrics = true,
  refresh = false,
) {
  if (!FAMILY_API_KEY) {
    throw new Error(
      `Drop ${eventId} and owners could not be fetched, ` +
      `configure Family API key`
    )
  }

  const response = await fetch(
    `${FAMILY_API_URL}/event/${eventId}?` +
    `description=${encodeURIComponent(includeDescription)}&` +
    `metrics=${encodeURIComponent(includeMetrics)}` +
    `${refresh ? '&refresh=true' : ''}`,
    {
      signal: abortSignal instanceof AbortSignal ? abortSignal : undefined,
      headers: {
        'x-api-key': FAMILY_API_KEY,
      },
    }
  )

  if (response.status === 404) {
    return null
  }

  if (response.status !== 200) {
    throw new Error(
      `Drop ${eventId} failed to fetch (status ${response.status})`
    )
  }

  /**
   * @type {unknown}
   */
  const body = await response.json()

  if (
    body == null ||
    typeof body !== 'object' ||
    !('event' in body) ||
    body.event == null ||
    typeof body.event !== 'object' ||
    !('owners' in body) ||
    body.owners == null ||
    !Array.isArray(body.owners) ||
    !('ts' in body) ||
    body.ts == null ||
    typeof body.ts !== 'number'
  ) {
    throw new Error(`Malformed drop and owners (type ${typeof body})`)
  }

  if (!includeMetrics) {
    return {
      event: Drop(body.event, includeDescription),
      owners: body.owners,
      ts: body.ts,
      metrics: null,
    }
  }

  if (
    !('metrics' in body) ||
    body.metrics == null ||
    typeof body.metrics !== 'object'
  ) {
    throw new Error(`Malformed drop metrics (type ${typeof body})`)
  }

  return {
    event: Drop(body.event, includeDescription),
    owners: body.owners,
    ts: body.ts,
    metrics: DropMetrics(body.metrics),
  }
}

/**
 * @param {number} eventId
 * @param {Record<number, string[]>} inCommon
 */
export async function putEventInCommon(eventId, inCommon) {
  if (!FAMILY_API_KEY) {
    throw new Error(
      `Last in common drops (${eventId}) could not be put, ` +
      `configure Family API key`
    )
  }

  const response = await fetch(
    `${FAMILY_API_URL}/event/${eventId}/in-common`,
    {
      method: 'PUT',
      headers: {
        'x-api-key': FAMILY_API_KEY,
        'content-type': 'application/json',
      },
      body: JSON.stringify(inCommon),
    }
  )

  if (response.status !== 200 && response.status !== 201) {
    throw new Error(
      `Drop ${eventId} in common save failed (status ${response.status})`
    )
  }
}

/**
 * @param {number} eventId
 * @param {AbortSignal | undefined | null} abortSignal
 * @returns {Promise<{
 *   inCommon: Record<number, string[]>
 *   events: Record<number, ReturnType<Drop>>
 *   ts: number
 * } | null>}
 */
export async function getInCommonEvents(eventId, abortSignal) {
  if (!FAMILY_API_KEY) {
    throw new Error(
      `Last in common drops (${eventId}) could not be fetched, ` +
      `configure Family API key`
    )
  }

  const response = await fetch(
    `${FAMILY_API_URL}/event/${eventId}/in-common`,
    {
      signal: abortSignal instanceof AbortSignal ? abortSignal : null,
      headers: {
        'x-api-key': FAMILY_API_KEY,
      },
    }
  )

  if (response.status === 404) {
    return null
  }

  if (response.status !== 200) {
    throw new Error(
      `Drop ${eventId} in common failed to fetch (status ${response.status})`
    )
  }

  /**
   * @type {unknown}
   */
  const body = await response.json()

  if (
    body == null ||
    typeof body !== 'object' ||
    !('inCommon' in body) ||
    body.inCommon == null ||
    typeof body.inCommon !== 'object' ||
    !('events' in body) ||
    body.events == null ||
    typeof body.events !== 'object' ||
    !('ts' in body) ||
    body.ts == null ||
    typeof body.ts !== 'number'
  ) {
    throw new Error(`Malformed in common drops (type ${typeof body})`)
  }

  return {
    inCommon: body.inCommon,
    events: Object.fromEntries(
      Object.entries(body.events).map(
        ([eventId, event]) => ([eventId, Drop(event)])
      )
    ),
    ts: body.ts,
  }
}

/**
 * @param {number} eventId
 * @param {AbortSignal | undefined | null} abortSignal
 * @param {(progressEvent: { progress?: number; rate?: number; estimated?: number }) => void} onProgress
 * @returns {Promise<{
 *   inCommon: Record<number, string[]>
 *   events: Record<number, ReturnType<Event>>
 *   ts: number
 * } | null>}
 */
export async function getInCommonEventsWithProgress(
  eventId,
  abortSignal,
  onProgress,
) {
  if (!FAMILY_API_KEY) {
    throw new Error(
      `Last in common drops (${eventId}) could not be fetched, ` +
      `configure Family API key`
    )
  }

  /**
   * @type {import('axios').AxiosResponse | undefined}
   */
  let response
  try {
    response = await axios.get(
      `${FAMILY_API_URL}/event/${eventId}/in-common`,
      {
        signal: abortSignal instanceof AbortSignal ? abortSignal : undefined,
        onDownloadProgress: onProgress,
        headers: {
          'x-api-key': FAMILY_API_KEY,
        },
      }
    )
  } catch (err) {
    if (err.response) {
      if (err.response.status === 404) {
        return null
      }

      console.error(err)

      throw new Error(
        `Drop ${eventId} in common failed to fetch ` +
        `(status ${err.response.status})`
      )
    }

    console.error(err)

    throw new Error(`Drop ${eventId} in common failed to fetch`)
  }

  if (response.status === 404) {
    return null
  }

  if (response.status !== 200) {
    throw new Error(
      `Drop ${eventId} in common failed to fetch ` +
      `(status ${response.status})`
    )
  }

  if (
    response.data == null ||
    typeof response.data !== 'object' ||
    !('inCommon' in response.data) ||
    response.data.inCommon == null ||
    typeof response.data.inCommon !== 'object' ||
    !('events' in response.data) ||
    response.data.events == null ||
    typeof response.data.events !== 'object' ||
    !('ts' in response.data) ||
    response.data.ts == null ||
    typeof response.data.ts !== 'number'
  ) {
    throw new Error(
      `Malformed in common drops (type ${typeof response.data})`
    )
  }

  return {
    inCommon: response.data.inCommon,
    events: Object.fromEntries(
      Object.entries(response.data.events).map(
        ([eventId, event]) => ([eventId, Drop(event)])
      )
    ),
    ts: response.data.ts,
  }
}

/**
 * @param {number} page
 * @param {number} qty
 * @returns {Promise<{
 *   pages: number
 *   total: number
 *   lastEvents: Array<{
 *     id: number
 *     name: string
 *     image_url: string
 *     cached_ts: number
 *     in_common_count: number
 *   }>
 * }>}
 */
export async function getLastEvents(page = 1, qty = 3) {
  if (!FAMILY_API_KEY) {
    throw new Error(
      `Last drops (${page}/${qty}) could not be fetched, ` +
      `configure Family API key`
    )
  }

  const response = await fetch(
    `${FAMILY_API_URL}/events/last` +
    `?page=${encodeURIComponent(page)}` +
    `&qty=${encodeURIComponent(qty)}`,
    {
      headers: {
        'x-api-key': FAMILY_API_KEY,
      },
    }
  )

  if (response.status !== 200) {
    throw new Error(`Last drops failed to fetch (status ${response.status})`)
  }

  /**
   * @type {unknown}
   */
  const body = await response.json()

  if (
    body == null ||
    typeof body !== 'object' ||
    !('lastEvents' in body) ||
    body.lastEvents == null ||
    !Array.isArray(body.lastEvents) ||
    !('pages' in body) ||
    body.pages == null ||
    typeof body.pages !== 'number' ||
    !('total' in body) ||
    body.total == null ||
    typeof body.total !== 'number'
  ) {
    throw new Error(`Malformed last drops (type ${typeof body})`)
  }

  return {
    pages: body.pages,
    total: body.total,
    lastEvents: body.lastEvents,
  }
}

/**
 * @param {number[]} eventIds
 * @param {AbortSignal | undefined | null} abortSignal
 * @returns {Promise<Record<number, ReturnType<Drop>>>}
 */
export async function getEvents(eventIds, abortSignal) {
  if (!FAMILY_API_KEY) {
    throw new Error(
      `Drops (${eventIds.length}) could not be fetched, ` +
      `configure Family API key`
    )
  }

  const response = await fetch(
    `${FAMILY_API_URL}/events` +
    `/${eventIds.map((eventId) => encodeURIComponent(eventId)).join(',')}`,
    {
      signal: abortSignal instanceof AbortSignal ? abortSignal : null,
      headers: {
        'x-api-key': FAMILY_API_KEY,
      },
    }
  )

  if (response.status !== 200) {
    /**
     * @type {string}
     */
    let message = 'Unknown error'
    try {
      const data = await response.json()
      if (
        data != null &&
        typeof data === 'object' &&
        'message' in data &&
        data.message != null &&
        typeof data.message === 'string'
      ) {
        message = data.message
      }
    } catch (err) {
      console.error(err)
    }

    if (message) {
      throw new Error(
        `Drops (${eventIds.length}) failed to fetch ` +
        `(status ${response.status}): ${message}`
      )
    }

    throw new Error(
      `Drops (${eventIds.length}) failed to fetch ` +
      `(status ${response.status})`
    )
  }

  /**
   * @type {unknown}
   */
  const body = await response.json()

  if (typeof body !== 'object') {
    throw new Error(`Malformed drops (type ${typeof body})`)
  }

  return Object.fromEntries(
    Object.entries(body).map(
      ([eventId, event]) => [eventId, Drop(event)]
    )
  )
}

/**
 * @param {number} eventId
 * @param {AbortSignal | undefined | null} abortSignal
 * @param {boolean} refresh
 * @returns {Promise<ReturnType<DropOwners> | null>}
 */
export async function getEventOwners(eventId, abortSignal, refresh = false) {
  if (!FAMILY_API_KEY) {
    throw new Error(
      `Drop ${eventId} owners could not be fetched, ` +
      `configure Family API key`
    )
  }

  const response = await fetch(
    `${FAMILY_API_URL}/event/${eventId}/owners${refresh ? '?refresh=true' : ''}`,
    {
      signal: abortSignal instanceof AbortSignal ? abortSignal : null,
      headers: {
        'x-api-key': FAMILY_API_KEY,
      },
    }
  )

  if (response.status === 404) {
    return null
  }

  if (response.status !== 200) {
    throw new Error(
      `Drop ${eventId} failed to fetch owners (status ${response.status})`
    )
  }

  /**
   * @type {unknown}
   */
  const body = await response.json()

  if (typeof body !== 'object') {
    throw new Error(`Malformed drop owners (type ${typeof body})`)
  }

  return DropOwners(body)
}

/**
 * @param {number[]} eventIds
 * @param {AbortSignal | undefined | null} abortSignal
 * @param {Record<number, Date> | undefined} expiryDates
 * @returns {Promise<Record<number, ReturnType<DropOwners>>>}
 */
export async function getEventsOwners(eventIds, abortSignal, expiryDates) {
  if (!FAMILY_API_KEY) {
    throw new Error(
      `Drops (${eventIds.length}) owners could not be fetched, ` +
      `configure Family API key`
    )
  }

  const encodedExpiryDates = expiryDates ? encodeExpiryDates(expiryDates) : ''
  const response = await fetch(
    `${FAMILY_API_URL}/events` +
      `/${eventIds.map((eventId) => encodeURIComponent(eventId)).join(',')}` +
      `/owners${encodedExpiryDates ? `?${encodedExpiryDates}` : ''}`,
    {
      signal: abortSignal instanceof AbortSignal ? abortSignal : null,
      headers: {
        'x-api-key': FAMILY_API_KEY,
      },
    }
  )

  if (response.status !== 200) {
    /**
     * @type {string}
     */
    let message = 'Unknown error'
    try {
      const data = await response.json()
      if (
        data != null &&
        typeof data === 'object' &&
        'message' in data &&
        data.message != null &&
        typeof data.message === 'string'
      ) {
        message = data.message
      }
    } catch (err) {
      console.error(err)
    }

    if (message) {
      throw new Error(
        `Drops (${eventIds.length}) failed to fetch owners ` +
        `(status ${response.status}): ${message}`
      )
    }

    throw new Error(
      `Drops (${eventIds.length}) failed to fetch owners ` +
      `(status ${response.status})`
    )
  }

  /**
   * @type {unknown}
   */
  const body = await response.json()

  if (typeof body !== 'object') {
    throw new Error(`Malformed drops owners (type ${typeof body})`)
  }

  return Object.fromEntries(
    Object.entries(body).map(
      ([eventId, event]) => [eventId, DropOwners(event)]
    )
  )
}

/**
 * @param {number} eventId
 * @param {AbortSignal | undefined | null} abortSignal
 * @param {boolean} refresh
 * @returns {Promise<ReturnType<DropMetrics> | null>}
 */
export async function getEventMetrics(eventId, abortSignal, refresh = false) {
  if (!FAMILY_API_KEY) {
    throw new Error(
      `Drop ${eventId} metrics could not be fetched, ` +
      `configure Family API key`
    )
  }

  const response = await fetch(
    `${FAMILY_API_URL}/event/${eventId}` +
    `/metrics${refresh ? '?refresh=true' : ''}`,
    {
      signal: abortSignal instanceof AbortSignal ? abortSignal : null,
      headers: {
        'x-api-key': FAMILY_API_KEY,
      },
    }
  )

  if (response.status === 404) {
    return null
  }

  if (response.status !== 200) {
    throw new Error(
      `Drop ${eventId} failed to fetch metrics (status ${response.status})`
    )
  }

  /**
   * @type {unknown}
   */
  const body = await response.json()

  if (typeof body !== 'object') {
    throw new Error(`Malformed drops metrics (type ${typeof body})`)
  }

  return DropMetrics(body)
}

/**
 * @param {number[]} eventIds
 * @param {AbortSignal | undefined | null} abortSignal
 * @param {Record<number, Date> | undefined} expiryDates
 * @returns {Promise<Record<number, ReturnType<DropMetrics>>>}
 */
export async function getEventsMetrics(eventIds, abortSignal, expiryDates) {
  if (!FAMILY_API_KEY) {
    throw new Error(
      `Drops (${eventIds.length}) metrics could not be fetched, ` +
      `configure Family API key`
    )
  }

  const encodedExpiryDates = expiryDates ? encodeExpiryDates(expiryDates) : ''
  const response = await fetch(
    `${FAMILY_API_URL}/events` +
    `/${eventIds.map((eventId) => encodeURIComponent(eventId)).join(',')}` +
    `/metrics${encodedExpiryDates ? `?${encodedExpiryDates}` : ''}`,
    {
      signal: abortSignal instanceof AbortSignal ? abortSignal : null,
      headers: {
        'x-api-key': FAMILY_API_KEY,
      },
    }
  )

  if (response.status !== 200) {
    /**
     * @type {string}
     */
    let message = 'Unknown error'
    try {
      const data = await response.json()
      if (
        data != null &&
        typeof data === 'object' &&
        'message' in data &&
        data.message != null &&
        typeof data.message === 'string'
      ) {
        message = data.message
      }
    } catch (err) {
      console.error(err)
    }

    if (message) {
      throw new Error(
        `Drops (${eventIds.length}) failed to fetch metrics ` +
        `(status ${response.status}): ${message}`
      )
    }

    throw new Error(
      `Drops (${eventIds.length}) failed to fetch metrics ` +
      `(status ${response.status})`
    )
  }

  /**
   * @type {unknown}
   */
  const body = await response.json()

  if (typeof body !== 'object') {
    throw new Error(`Malformed drops metrics (type ${typeof body})`)
  }

  return Object.fromEntries(
    Object.entries(body).map(
      ([eventId, event]) => [eventId, DropMetrics(event)]
    )
  )
}

/**
 * @param {string} passphrase
 */
export async function auth(passphrase) {
  const response = await fetch(`${FAMILY_API_URL}/auth`, {
    method: 'POST',
    headers: {
      'x-api-key': passphrase,
    },
  })

  if (response.status !== 200) {
    throw new Error(`Incorrect passphrase`)
  }
}

/**
 * @param {string} message
 * @param {string} url
 */
export async function addFeedback(message, url) {
  const response = await fetch(`${FAMILY_API_URL}/feedback`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      feedback: message,
      location: url,
    }),
  })

  if (response.status !== 200 && response.status !== 201) {
    throw new Error(`Feedback save failed (status ${response.status})`)
  }
}

/**
 * @param {string} passphrase
 * @param {number} page
 * @param {number} qty
 * @returns {Promise<{
 *   pages: number
 *   total: number
 *   feedback: Array<{
 *     id: number
 *     message: string
 *     location: string
 *     ts: number
 *   }>
 * }>}
 */
export async function getFeedback(passphrase, page = 1, qty = 3) {
  const response = await fetch(
    `${FAMILY_API_URL}/feedback` +
    `?page=${encodeURIComponent(page)}` +
    `&qty=${encodeURIComponent(qty)}`,
    {
      headers: {
        'x-api-key': passphrase,
      },
    }
  )

  if (response.status !== 200) {
    throw new Error(`Feedback failed to fetch`)
  }

  /**
   * @type {unknown}
   */
  const body = await response.json()

  if (
    body == null ||
    typeof body !== 'object' ||
    !('feedback' in body) ||
    body.feedback == null ||
    !Array.isArray(body.feedback) ||
    !('pages' in body) ||
    body.pages == null ||
    typeof body.pages !== 'number' ||
    !('total' in body) ||
    body.total == null ||
    typeof body.total !== 'number'
  ) {
    throw new Error(`Malformed feedback`)
  }

  return {
    pages: body.pages,
    total: body.total,
    feedback: body.feedback,
  }
}

/**
 * @param {number} id
 * @param {string} passphrase
 */
export async function delFeedback(id, passphrase) {
  const response = await fetch(`${FAMILY_API_URL}/feedback/${id}`, {
    method: 'DELETE',
    headers: {
      'x-api-key': passphrase,
    },
  })

  if (response.status !== 200) {
    throw new Error(`Feedback delete failed (status ${response.status})`)
  }
}
