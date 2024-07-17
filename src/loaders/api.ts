import axios, { AxiosResponse } from 'axios'
import {
  parseCachedEvent,
  FAMILY_API_KEY,
  FAMILY_API_URL,
  parseInCommon,
  CachedEvent,
  InCommon,
} from 'models/api'
import { encodeExpiryDates } from 'models/event'
import { parseDrop, parseDropMetrics, parseDropOwners, Drop, DropMetrics, DropOwners } from 'models/drop'
import { AbortedError, HttpError } from 'models/error'

export async function getEventAndOwners(
  eventId: number,
  abortSignal: AbortSignal,
  includeDescription: boolean = false,
  includeMetrics: boolean = true,
  refresh: boolean = false,
): Promise<{
  event: Drop
  owners: string[]
  ts: number
  metrics: DropMetrics | null
} | null> {
  if (!FAMILY_API_KEY) {
    throw new Error(
      `Drop ${eventId} and owners could not be fetched, ` +
      `configure Family API key`
    )
  }

  let response: Response

  try {
    response = await fetch(
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
  } catch (err) {
    if (err.code === 20) {
      throw new AbortedError(`Fetch drop ${eventId} aborted`, { cause: err })
    }
    throw new Error(
      `Cannot fetch drop ${eventId}: ` +
      `response was not success (network error)`,
      { cause: err }
    )
  }

  if (response.status === 404) {
    return null
  }

  if (response.status !== 200) {
    throw new HttpError(
      `Drop ${eventId} failed to fetch (status ${response.status})`,
      { status: response.status }
    )
  }

  const body: unknown = await response.json()

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
      event: parseDrop(body.event, includeDescription),
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
    event: parseDrop(body.event, includeDescription),
    owners: body.owners,
    ts: body.ts,
    metrics: parseDropMetrics(body.metrics),
  }
}

export async function putEventInCommon(eventId: number, inCommon: Record<number, string[]>) {
  if (!FAMILY_API_KEY) {
    throw new Error(
      `Last in common drops (${eventId}) could not be put, ` +
      `configure Family API key`
    )
  }

  let response: Response

  try {
    response = await fetch(
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
  } catch (err) {
    if (err.code === 20) {
      throw new AbortedError(`Put drop in common aborted`, { cause: err })
    }
    throw new Error(
      `Cannot put drop in common: response was not success (network error)`,
      { cause: err }
    )
  }

  if (response.status !== 200 && response.status !== 201) {
    throw new HttpError(
      `Drop ${eventId} in common save failed (status ${response.status})`,
      { status: response.status }
    )
  }
}

export async function getInCommonEvents(eventId: number, abortSignal: AbortSignal): Promise<{
  inCommon: InCommon
  events: Record<number, Drop>
  ts: number
} | null> {
  if (!FAMILY_API_KEY) {
    throw new Error(
      `Last in common drops (${eventId}) could not be fetched, ` +
      `configure Family API key`
    )
  }

  let response: Response

  try {
    response = await fetch(
      `${FAMILY_API_URL}/event/${eventId}/in-common`,
      {
        signal: abortSignal instanceof AbortSignal ? abortSignal : null,
        headers: {
          'x-api-key': FAMILY_API_KEY,
        },
      }
    )
  } catch (err) {
    if (err.code === 20) {
      throw new AbortedError(
        `Fetch drop ${eventId} in common aborted`,
        { cause: err }
      )
    }
    throw new Error(
      `Cannot fetch drop ${eventId} in common: ` +
      `response was not success (network error)`,
      { cause: err }
    )
  }

  if (response.status === 404) {
    return null
  }

  if (response.status !== 200) {
    throw new HttpError(
      `Drop ${eventId} in common failed to fetch (status ${response.status})`,
      { status: response.status }
    )
  }

  const body: unknown = await response.json()

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
    inCommon: parseInCommon(body.inCommon),
    events: Object.fromEntries(
      Object.entries(body.events).map(
        ([eventId, event]) => ([
          eventId,
          parseDrop(event, /*includeDescription*/false),
        ])
      )
    ),
    ts: body.ts,
  }
}

export async function getInCommonEventsWithProgress(
  eventId: number,
  abortSignal: AbortSignal,
  onProgress: (progressEvent: { progress?: number; rate?: number; estimated?: number }) => void,
): Promise<{
  inCommon: Record<number, string[]>
  events: Record<number, Drop>
  ts: number
} | null> {
  if (!FAMILY_API_KEY) {
    throw new Error(
      `Last in common drops (${eventId}) could not be fetched, ` +
      `configure Family API key`
    )
  }

  let response: AxiosResponse

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
    const status =
      err != null &&
      typeof err === 'object' &&
      'response' in err &&
      err.response != null &&
      typeof err.response === 'object' &&
      'status' in err.response &&
      err.response.status != null &&
      typeof err.response.status === 'number'
        ? err.response.status
        : 500

    if (status === 404) {
      return null
    }

    if (axios.isCancel(err)) {
      throw new AbortedError(
        `Drop ${eventId} in common aborted`,
        { cause: err }
      )
    }

    throw new Error(
      `Drop ${eventId} in common failed to fetch (status ${status})`,
      { cause: err }
    )
  }

  if (response.status === 404) {
    return null
  }

  if (response.status !== 200) {
    throw new HttpError(
      `Drop ${eventId} in common failed to fetch ` +
      `(status ${response.status})`,
      { status: response.status }
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
    inCommon: parseInCommon(response.data.inCommon),
    events: Object.fromEntries(
      Object.entries(response.data.events).map(
        ([eventId, event]) => ([
          eventId,
          parseDrop(event, /*includeDescription*/false),
        ])
      )
    ),
    ts: response.data.ts,
  }
}

export async function getLastEvents(page: number = 1, qty: number = 3): Promise<{
  pages: number
  total: number
  lastEvents: CachedEvent[]
}> {
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
    throw new HttpError(
      `Last drops failed to fetch (status ${response.status})`,
      { status: response.status }
    )
  }

  const body: unknown = await response.json()

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
    lastEvents: body.lastEvents.map((cachedEvent) => parseCachedEvent(cachedEvent)),
  }
}

export async function getEvents(eventIds: number[], abortSignal?: AbortSignal): Promise<Record<number, Drop>> {
  if (!FAMILY_API_KEY) {
    throw new Error(
      `Drops (${eventIds.length}) could not be fetched, ` +
      `configure Family API key`
    )
  }

  let response: Response

  try {
    response = await fetch(
      `${FAMILY_API_URL}/events` +
      `/${eventIds.map((eventId) => encodeURIComponent(eventId)).join(',')}`,
      {
        signal: abortSignal instanceof AbortSignal ? abortSignal : null,
        headers: {
          'x-api-key': FAMILY_API_KEY,
        },
      }
    )
  } catch (err) {
    if (err.code === 20) {
      throw new AbortedError(`Fetch drops aborted`, { cause: err })
    }
    throw new Error(
      `Cannot fetch drops: response was not success (network error)`,
      { cause: err }
    )
  }

  if (response.status !== 200) {
    let message: string = 'Unknown error'
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
      throw new HttpError(
        `Drops (${eventIds.length}) failed to fetch ` +
        `(status ${response.status}): ${message}`,
        { status: response.status }
      )
    }

    throw new HttpError(
      `Drops (${eventIds.length}) failed to fetch ` +
      `(status ${response.status})`,
      { status: response.status }
    )
  }

  const body: unknown = await response.json()

  if (body == null || typeof body !== 'object') {
    throw new Error(`Malformed drops (type ${typeof body})`)
  }

  return Object.fromEntries(
    Object.entries(body).map(
      ([eventId, event]) => [
        eventId,
        parseDrop(event, /*includeDescription*/false),
      ]
    )
  )
}

export async function getEventOwners(
  eventId: number,
  abortSignal?: AbortSignal,
  refresh: boolean = false,
): Promise<DropOwners | null> {
  if (!FAMILY_API_KEY) {
    throw new Error(
      `Drop ${eventId} owners could not be fetched, ` +
      `configure Family API key`
    )
  }

  let response: Response

  try {
    response = await fetch(
      `${FAMILY_API_URL}/event/${eventId}/owners${refresh ? '?refresh=true' : ''}`,
      {
        signal: abortSignal instanceof AbortSignal ? abortSignal : null,
        headers: {
          'x-api-key': FAMILY_API_KEY,
        },
      }
    )
  } catch (err) {
    if (err.code === 20) {
      throw new AbortedError(
        `Fetch drop ${eventId} owners aborted`,
        { cause: err }
      )
    }
    throw new Error(
      `Cannot fetch drop ${eventId} owners: ` +
      `response was not success (network error)`,
      { cause: err }
    )
  }

  if (response.status === 404) {
    return null
  }

  if (response.status !== 200) {
    throw new HttpError(
      `Drop ${eventId} failed to fetch owners (status ${response.status})`,
      { status: response.status }
    )
  }

  const body: unknown = await response.json()

  if (body == null || typeof body !== 'object') {
    throw new Error(`Malformed drop owners (type ${typeof body})`)
  }

  return parseDropOwners(body)
}

export async function getEventsOwners(
  eventIds: number[],
  abortSignal?: AbortSignal,
  expiryDates?: Record<number, Date>,
): Promise<Record<number, DropOwners>> {
  if (!FAMILY_API_KEY) {
    throw new Error(
      `Drops (${eventIds.length}) owners could not be fetched, ` +
      `configure Family API key`
    )
  }

  const encodedExpiryDates = expiryDates ? encodeExpiryDates(expiryDates) : ''

  let response: Response

  try {
    response = await fetch(
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
  } catch (err) {
    if (err.code === 20) {
      throw new AbortedError(`Fetch drops owners aborted`, { cause: err })
    }
    throw new Error(
      `Cannot fetch drops owners: response was not success (network error)`,
      { cause: err }
    )
  }

  if (response.status !== 200) {
    let message: string = 'Unknown error'
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
      throw new HttpError(
        `Drops (${eventIds.length}) failed to fetch owners ` +
        `(status ${response.status}): ${message}`,
        { status: response.status }
      )
    }

    throw new HttpError(
      `Drops (${eventIds.length}) failed to fetch owners ` +
      `(status ${response.status})`,
      { status: response.status }
    )
  }

  const body: unknown = await response.json()

  if (body == null || typeof body !== 'object') {
    throw new Error(`Malformed drops owners (type ${typeof body})`)
  }

  return Object.fromEntries(
    Object.entries(body).map(
      ([eventId, event]) => [eventId, parseDropOwners(event)]
    )
  )
}

export async function getEventMetrics(
  eventId: number,
  abortSignal?: AbortSignal,
  refresh: boolean = false,
): Promise<DropMetrics | null> {
  if (!FAMILY_API_KEY) {
    throw new Error(
      `Drop ${eventId} metrics could not be fetched, ` +
      `configure Family API key`
    )
  }

  let response: Response

  try {
    response = await fetch(
      `${FAMILY_API_URL}/event/${eventId}` +
      `/metrics${refresh ? '?refresh=true' : ''}`,
      {
        signal: abortSignal instanceof AbortSignal ? abortSignal : null,
        headers: {
          'x-api-key': FAMILY_API_KEY,
        },
      }
    )
  } catch (err) {
    if (err.code === 20) {
      throw new AbortedError(
        `Fetch drop ${eventId} metrics aborted`,
        { cause: err }
      )
    }
    throw new Error(
      `Cannot fetch drop ${eventId} metrics: ` +
      `response was not success (network error)`,
      { cause: err }
    )
  }

  if (response.status === 404) {
    return null
  }

  if (response.status !== 200) {
    throw new HttpError(
      `Drop ${eventId} failed to fetch metrics (status ${response.status})`,
      { status: response.status }
    )
  }

  const body: unknown = await response.json()

  if (body == null || typeof body !== 'object') {
    throw new Error(`Malformed drops metrics (type ${typeof body})`)
  }

  return parseDropMetrics(body)
}

export async function getEventsMetrics(
  eventIds: number[],
  abortSignal?: AbortSignal,
  expiryDates?: Record<number, Date>,
): Promise<Record<number, DropMetrics>> {
  if (!FAMILY_API_KEY) {
    throw new Error(
      `Drops (${eventIds.length}) metrics could not be fetched, ` +
      `configure Family API key`
    )
  }

  const encodedExpiryDates = expiryDates ? encodeExpiryDates(expiryDates) : ''

  let response: Response

  try {
    response = await fetch(
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
  } catch (err) {
    if (err.code === 20) {
      throw new AbortedError(`Fetch drops metrics aborted`, { cause: err })
    }
    throw new Error(
      `Cannot fetch drops metrics: response was not success (network error)`,
      { cause: err }
    )
  }

  if (response.status !== 200) {
    let message: string = 'Unknown error'
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
      throw new HttpError(
        `Drops (${eventIds.length}) failed to fetch metrics ` +
        `(status ${response.status}): ${message}`,
        { status: response.status }
      )
    }

    throw new HttpError(
      `Drops (${eventIds.length}) failed to fetch metrics ` +
      `(status ${response.status})`,
      { status: response.status }
    )
  }

  const body: unknown = await response.json()

  if (body == null || typeof body !== 'object') {
    throw new Error(`Malformed drops metrics (type ${typeof body})`)
  }

  return Object.fromEntries(
    Object.entries(body).map(
      ([eventId, event]) => [eventId, parseDropMetrics(event)]
    )
  )
}

export async function auth(passphrase: string) {
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

export async function addFeedback(message: string, url: string): Promise<void> {
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
    throw new HttpError(
      `Feedback save failed (status ${response.status})`,
      { status: response.status }
    )
  }
}

export async function getFeedback(
  passphrase: string,
  page: number = 1,
  qty: number = 3,
): Promise<{
  pages: number
  total: number
  feedback: Array<{
    id: number
    message: string
    location: string
    ts: number
  }>
}> {
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

  const body: unknown = await response.json()

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

export async function delFeedback(id: number, passphrase: string): Promise<void> {
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
