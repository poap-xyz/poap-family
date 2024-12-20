import axios, { AxiosResponse } from 'axios'
import {
  parseCachedEvent,
  FAMILY_API_KEY,
  FAMILY_API_URL,
  CachedEvent,
  Feedback,
  EventsInCommon,
} from 'models/api'
import { parseDrop, Drop } from 'models/drop'
import { parseInCommon } from 'models/in-common'
import { AbortedError, HttpError } from 'models/error'
import { DownloadProgress } from 'models/http'

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
    totalInCommon: number | null,
    receivedEvents: number | null,
    totalEvents: number | null,
  ) => void,
  onTs?: (ts: number) => void,
  onEventIds?: (eventIds: number[]) => void,
  onTotal?: (total: number) => void,
  onInCommon?: (eventId: number, owners: string[]) => void,
  onEventsTotal?: (eventsTotal: number) => void,
  onEvents?: (events: Drop[]) => void,
): Promise<EventsInCommon | null> {
  let resolved = false

  let totalInCommon: number | null = null
  let totalEvents: number | null = null
  let receivedEventIds: number | null = null
  let receivedOwners: number | null = null
  let receivedEvents: number | null = null

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
      if (resolved) {
        return
      }

      resolved = true
      inCommonStream.close()

      if (
        inCommon.ts != null &&
        totalInCommon != null &&
        receivedEventIds != null &&
        receivedOwners != null &&
        receivedOwners === receivedEventIds &&
        receivedEventIds === totalInCommon &&
        receivedEvents != null &&
        totalEvents != null &&
        receivedEvents === totalEvents &&
        Object.keys(inCommon.events).length === totalEvents
      ) {
        resolve(inCommon)
      } else {
        reject(new Error(
          `Connection lost to event '${eventId}' in common streaming`
        ))
      }
    })

    inCommonStream.addEventListener('message', (ev) => {
      let data: unknown | undefined
      try {
        data = JSON.parse(ev.data)
      } catch {
        resolved = true
        inCommonStream.close()
        reject(new Error(
          `Cannot parse data '${ev.data}' when streaming ` +
          `event '${eventId}' in common`
        ))
        return
      }
      if (!data || typeof data !== 'object') {
        resolved = true
        inCommonStream.close()
        reject(new Error(
          `Malformed data '${data}' when streaming event '${eventId}' in common`
        ))
        return
      }
      if ('ts' in data && data.ts && typeof data.ts === 'number') {
        inCommon.ts = data.ts
        onTs?.(data.ts)
        onProgress?.(
          receivedOwners,
          receivedEventIds,
          totalInCommon,
          receivedEvents,
          totalEvents
        )
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
        onProgress?.(
          receivedOwners,
          receivedEventIds,
          totalInCommon,
          receivedEvents,
          totalEvents
        )
      }
      if ('total' in data && data.total && typeof data.total === 'number') {
        if (totalInCommon != null) {
          resolved = true
          inCommonStream.close()
          reject(new Error(
            `Received total (with value ${data.total} was ${totalInCommon}) ` +
            `two times when streaming event '${eventId}' in common`
          ))
          return
        }
        totalInCommon = data.total
        onTotal?.(totalInCommon)
        onProgress?.(
          receivedOwners,
          receivedEventIds,
          totalInCommon,
          receivedEvents,
          totalEvents
        )
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
          resolved = true
          inCommonStream.close()
          reject(new Error(
            `Received the first in common event before the total ` +
            `when streaming event '${eventId}' in common`
          ))
          return
        }
        inCommon.inCommon[data.eventId] = data.owners
        onInCommon?.(data.eventId, data.owners)
        onProgress?.(
          receivedOwners,
          receivedEventIds,
          totalInCommon,
          receivedEvents,
          totalEvents
        )
      }
      if (
        'events' in data &&
        data.events &&
        Array.isArray(data.events) &&
        data.events.every(
          (event) => (
            event && typeof event === 'object' &&
            'id' in event && event.id && typeof event.id === 'number'
          )
        )
      ) {
        const newEvents = data.events.filter((event) =>
          !Object.keys(inCommon.events).includes(String(event.id))
        )

        if (newEvents.length > 0) {
          const drops = newEvents.map(
            (event) => parseDrop(event, /*includeDescription*/false)
          )
          if (receivedEvents == null) {
            receivedEvents = drops.length
          } else {
            receivedEvents += drops.length
          }
          for (const drop of drops) {
            inCommon.events[drop.id] = drop
          }
          onEvents?.(drops)
          onProgress?.(
            receivedOwners,
            receivedEventIds,
            totalInCommon,
            receivedEvents,
            totalEvents
          )
        } else {
          console.info(
            `Received empty list of events ` +
            `when streaming event '${eventId}' in common`
          )
        }
      }
      if (
        'eventsTotal' in data &&
        data.eventsTotal &&
        typeof data.eventsTotal === 'number'
      ) {
        if (totalEvents != null) {
          resolved = true
          inCommonStream.close()
          reject(new Error(
            `Received events total (with value ${data.eventsTotal} was ${totalEvents}) ` +
            `two times when streaming event '${eventId}' in common`
          ))
          return
        }
        totalEvents = data.eventsTotal
        onEventsTotal?.(data.eventsTotal)
        onProgress?.(
          receivedOwners,
          receivedEventIds,
          totalInCommon,
          receivedEvents,
          totalEvents
        )
      }
      if (
        inCommon.ts != null &&
        totalInCommon != null &&
        receivedEventIds != null &&
        receivedOwners != null &&
        receivedOwners === receivedEventIds &&
        receivedEventIds === totalInCommon &&
        receivedEvents != null &&
        totalEvents != null &&
        receivedEvents === totalEvents &&
        Object.keys(inCommon.events).length === totalEvents
      ) {
        resolved = true
        inCommonStream.close()
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
