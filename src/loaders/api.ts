import axios, { AxiosResponse } from 'axios'
import {
  parseCachedEvent,
  FAMILY_API_KEY,
  FAMILY_API_URL,
  parseInCommon,
  CachedEvent,
  Feedback,
  EventsInCommon,
  EventAndOwners,
} from 'models/api'
import { encodeExpiryDates } from 'models/event'
import { parseDrop, parseDropMetrics, parseDropOwners, Drop, DropMetrics, DropOwners } from 'models/drop'
import { AbortedError, HttpError } from 'models/error'
import { DownloadProgress } from 'models/http'

export async function getEventAndOwners(
  eventId: number,
  abortSignal: AbortSignal,
  includeDescription: boolean = false,
  includeMetrics: boolean = true,
  refresh: boolean = false,
): Promise<EventAndOwners | null> {
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
  } catch (err: unknown) {
    if (err instanceof Error && err.name === 'AbortError') {
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

export async function getInCommonEvents(
  eventId: number,
  abortSignal: AbortSignal,
  refresh: boolean = false,
): Promise<EventsInCommon | null> {
  if (!FAMILY_API_KEY) {
    throw new Error(
      `Last in common drops (${eventId}) could not be fetched, ` +
      `configure Family API key`
    )
  }

  let response: Response

  try {
    response = await fetch(
      `${FAMILY_API_URL}/event/${eventId}` +
      `/in-common${refresh ? '?refresh=true' : ''}`,
      {
        signal: abortSignal instanceof AbortSignal ? abortSignal : null,
        headers: {
          'x-api-key': FAMILY_API_KEY,
        },
      }
    )
  } catch (err: unknown) {
    if (err instanceof Error && err.name === 'AbortError') {
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
  onProgress: (progressEvent: Partial<DownloadProgress>) => void,
  refresh: boolean = false,
): Promise<EventsInCommon | null> {
  if (!FAMILY_API_KEY) {
    throw new Error(
      `Last in common drops (${eventId}) could not be fetched, ` +
      `configure Family API key`
    )
  }

  let response: AxiosResponse

  try {
    response = await axios.get(
      `${FAMILY_API_URL}/event/${eventId}` +
      `/in-common${refresh ? '?refresh=true' : ''}`,
      {
        signal: abortSignal instanceof AbortSignal ? abortSignal : undefined,
        onDownloadProgress: onProgress,
        headers: {
          'x-api-key': FAMILY_API_KEY,
        },
      }
    )
  } catch (err: unknown) {
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

export async function getInCommonEventsWithEvents(
  eventId: number,
  refresh: boolean = false,
  abortSignal?: AbortSignal,
  onProgress?: (
    receivedOwners: number | null,
    receivedEventIds: number | null,
    totalInCommon: number | null
  ) => void,
  onTs?: (ts: number) => void,
  onEventIds?: (eventIds: number[]) => void,
  onTotal?: (total: number) => void,
  onInCommon?: (eventId: number, owners: string[]) => void,
): Promise<EventsInCommon | null> {
  let totalInCommon: number | null = null
  let receivedEventIds: number | null = null
  let receivedOwners: number | null = null

  const inCommon: EventsInCommon = {
    events: {},
    inCommon: {},
    ts: null,
  }
  const inCommonStream = new EventSource(
    `${FAMILY_API_URL}/event/${eventId}/in-common` +
      `/stream${refresh ? '?refresh=true' : ''}`
  )

  if (abortSignal) {
    abortSignal.addEventListener('abort', () => {
      inCommonStream.close()
    })
  }

  return new Promise((resolve, reject) => {
    inCommonStream.addEventListener('error', (ev) => {
      inCommonStream.close()
      reject(new Error(
        `Connection lost to event '${eventId}' in common streaming`
      ))
    })

    inCommonStream.addEventListener('message', (ev) => {
      let data: unknown | undefined
      try {
        data = JSON.parse(ev.data)
      } catch {
        reject(new Error(
          `Cannot parse data '${ev.data}' when streaming ` +
          `event '${eventId}' in common`
        ))
        return
      }
      if (!data || typeof data !== 'object') {
        reject(new Error(
          `Malformed data '${data}' when streaming event '${eventId}' in common`
        ))
        return
      }
      if ('ts' in data && data.ts && typeof data.ts === 'number') {
        inCommon.ts = data.ts
        onTs?.(data.ts)
        onProgress?.(receivedOwners, receivedEventIds, totalInCommon)
      }
      if (
        'eventIds' in data &&
        data.eventIds &&
        Array.isArray(data.eventIds) &&
        data.eventIds.every(
          (eventId) => eventId && typeof eventId === 'number'
        )
      ) {
        if (receivedEventIds == null) {
          receivedEventIds = data.eventIds.length
        } else {
          receivedEventIds += data.eventIds.length
        }
        for (const eventId of data.eventIds) {
          inCommon.inCommon[eventId] = []
        }
        onEventIds?.(data.eventIds)
        onProgress?.(receivedOwners, receivedEventIds, totalInCommon)
      }
      if ('total' in data && data.total && typeof data.total === 'number') {
        if (totalInCommon != null) {
          reject(new Error(
            `Received total (with value ${data.total} was ${totalInCommon}) ` +
            `two times when streaming event '${eventId}' in common`
          ))
        }
        totalInCommon = data.total
        onTotal?.(totalInCommon)
        onProgress?.(receivedOwners, receivedEventIds, totalInCommon)
      }
      if (
        'eventId' in data &&
        data.eventId &&
        typeof data.eventId === 'number' &&
        'owners' in data &&
        data.owners &&
        Array.isArray(data.owners) &&
        data.owners.every(
          (owner) => owner && typeof owner === 'string'
        )
      ) {
        if (receivedOwners == null) {
          receivedOwners = 1
        } else {
          receivedOwners++
        }
        if (!receivedEventIds || !totalInCommon) {
          reject(new Error(
            `Received the first in common event before the total ` +
            `when streaming event '${eventId}' in common`
          ))
        }
        inCommon.inCommon[data.eventId] = data.owners
        onInCommon?.(data.eventId, data.owners)
        onProgress?.(receivedOwners, receivedEventIds, totalInCommon)
      }
      if (
        'events' in data &&
        data.events &&
        typeof data.events === 'object'
      ) {
        inCommon.events = Object.fromEntries(
          Object.entries(data.events).map(
            ([eventIdRaw, eventData]) => [
              eventIdRaw,
              parseDrop(eventData, /*includeDescription*/false),
            ]
          )
        )
      }
      if (
        inCommon.ts != null &&
        receivedEventIds != null &&
        receivedOwners != null &&
        receivedOwners === receivedEventIds &&
        Object.values(inCommon.inCommon).every((owners) => owners.length > 0) &&
        Object.keys(inCommon.events).length > 0
      ) {
        resolve(inCommon)
        return
      }
    })
  })
}

export async function getLastEvents(
  page: number = 1,
  qty: number = 3,
): Promise<{
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
    lastEvents: body.lastEvents.map(
      (cachedEvent: unknown) => parseCachedEvent(cachedEvent)
    ),
  }
}

export async function getEvents(
  eventIds: number[],
  abortSignal?: AbortSignal,
): Promise<Record<number, Drop>> {
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
  } catch (err: unknown) {
    if (err instanceof Error && err.name === 'AbortError') {
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
    } catch (err: unknown) {
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
  } catch (err: unknown) {
    if (err instanceof Error && err.name === 'AbortError') {
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
  } catch (err: unknown) {
    if (err instanceof Error && err.name === 'AbortError') {
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
    } catch (err: unknown) {
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
  } catch (err: unknown) {
    if (err instanceof Error && err.name === 'AbortError') {
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
  } catch (err: unknown) {
    if (err instanceof Error && err.name === 'AbortError') {
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
    } catch (err: unknown) {
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

export async function auth(passphrase: string): Promise<void> {
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
  feedback: Feedback[]
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

export async function delFeedback(
  id: number,
  passphrase: string,
): Promise<void> {
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
