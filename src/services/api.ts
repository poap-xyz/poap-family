import axios, { AxiosResponse } from 'axios'
import {
  parseCachedEvent,
  FAMILY_API_KEY,
  FAMILY_API_URL,
  CachedEvent,
  EventsInCommon,
} from 'models/api'
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
    !('ts' in body) ||
    body.ts == null ||
    typeof body.ts !== 'number'
  ) {
    throw new Error(`Malformed in common drops (type ${typeof body})`)
  }

  return {
    inCommon: parseInCommon(body.inCommon),
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
    totalEvents: number | null,
  ) => void,
  onTs?: (ts: number) => void,
  onEventIds?: (eventIds: number[]) => void,
  onTotal?: (total: number) => void,
  onInCommon?: (eventId: number, owners: string[]) => void,
  onEventsTotal?: (eventsTotal: number) => void,
): Promise<EventsInCommon | null> {
  let resolved = false

  let totalInCommon: number | null = null
  let totalEvents: number | null = null
  let receivedEventIds: number | null = null
  let receivedOwners: number | null = null

  const inCommon: EventsInCommon = {
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
        totalEvents != null
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
          totalEvents
        )
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
        totalEvents != null
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
