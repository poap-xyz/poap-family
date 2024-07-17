import { filterInvalidOwners } from 'models/address'
import { DEFAULT_SEARCH_LIMIT, parseEventIds } from 'models/event'
import { Drop, parseDrop } from 'models/drop'
import { POAP_API_URL, POAP_API_KEY } from 'models/poap'
import { AbortedError, HttpError } from 'models/error'
import { getEventAndOwners, getEventMetrics, getEvents } from 'loaders/api'
import { fetchPOAPs } from 'loaders/poap'

export async function searchEvents(
  query: string,
  abortSignal: AbortSignal,
  offset: number = 0,
  limit: number = DEFAULT_SEARCH_LIMIT,
): Promise<{
  items: Drop[]
  total: number
  offset: number
  limit: number
}> {
  let response: Response
  try {
    response = await fetch(
      `${POAP_API_URL}/paginated-events?name=${encodeURIComponent(query)}` +
      `&sort_field=start_date` +
      `&sort_dir=desc` +
      `&offset=${offset}` +
      `&limit=${limit}`,
      {
        signal: abortSignal instanceof AbortSignal ? abortSignal : null,
        headers: {
          'x-api-key': POAP_API_KEY,
        },
      }
    )
  } catch (err) {
    if (err.code === 20) {
      throw new AbortedError(
        `Search drops for "${query}" aborted`,
        { cause: err }
      )
    }
    throw new Error(
      `Cannot search drops for "${query}": ` +
      `response was not success (network error)`,
      { cause: err }
    )
  }

  if (response.status !== 200) {
    let message: string | undefined
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
        `Search events was not success ` +
        `(status ${response.status}): ${message}`,
        { status: response.status }
      )
    } else {
      throw new HttpError(
        `Search events was not success ` +
        `(status ${response.status})`,
        { status: response.status }
      )
    }
  }

  const body: unknown = await response.json()

  if (
    body == null ||
    typeof body !== 'object' ||
    !('items' in body) ||
    body.items == null ||
    !Array.isArray(body.items) ||
    !('total' in body) ||
    body.total == null ||
    typeof body.total !== 'number' ||
    !('offset' in body) ||
    body.offset == null ||
    typeof body.offset !== 'number' ||
    !('limit' in body) ||
    body.limit == null ||
    typeof body.limit !== 'number'
  ) {
    throw new Error(`Search events response malformed`)
  }

  return {
    items: body.items.map((item) => parseDrop(item, /*includeDescription*/false)),
    total: body.total,
    offset: body.offset,
    limit: body.limit,
  }
}

export async function fetchEventsOrErrors(eventIds: number[], limit: number = 100): Promise<[Record<number, Drop>, Record<number, Error>]> {
  const eventsMap: Record<number, Drop> = {}
  const errorsMap: Record<number, Error> = {}

  for (let i = 0; i < eventIds.length; i += limit) {
    const ids = eventIds.slice(i, i + limit)

    if (ids.length === 0) {
      break
    }

    let response: Response
    try {
      response = await fetch(
        `${POAP_API_URL}/paginated-events` +
        `?event_ids=${ids.map((eventId) => encodeURIComponent(eventId)).join(',')}` +
        `&limit=${limit}`,
        {
          headers: {
            'x-api-key': POAP_API_KEY,
          },
        }
      )
    } catch (err) {
      for (const id of ids) {
        errorsMap[id] = new Error(
          `Cannot fetch drop ${id}: response was not success (network error)`,
          { cause: err }
        )
      }

      continue
    }

    if (response.status !== 200) {
      let message: string | undefined
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

      for (const id of ids) {
        if (message) {
          errorsMap[id] = new HttpError(
            `Cannot fetch drop ${id}: ` +
            `response was not success (status ${response.status}): ${message}`,
            { status: response.status }
          )
        } else {
          errorsMap[id] = new HttpError(
            `Cannot fetch drop ${id}: ` +
            `response was not success (status ${response.status})`,
            { status: response.status }
          )
        }
      }

      continue
    }

    try {
      const data: unknown = await response.json()
      if (
        data != null &&
        typeof data === 'object' &&
        'items' in data &&
        data.items != null &&
        Array.isArray(data.items)
      ) {
        for (const item of data.items) {
          const event = parseDrop(item, /*includeDescription*/false)
          eventsMap[event.id] = event
        }

        for (const id of ids) {
          if (!(id in eventsMap)) {
            errorsMap[id] = new HttpError(
              `Drop '${id}' not found on response`,
              { status: 404 }
            )
          }
        }
      } else {
        for (const id of ids) {
          if (!(id in eventsMap)) {
            errorsMap[id] = new Error(`Malformed drop response '${id}'`)
          }
        }
      }
    } catch (err) {
      console.error(err)

      for (const id of ids) {
        if (!(id in eventsMap)) {
          errorsMap[id] = new Error(`Malformed drop '${id}': ${err.message}`)
        }
      }
    }
  }

  return [eventsMap, errorsMap]
}

export async function fetchEvent(eventId: number, includeDescription: boolean, abortSignal?: AbortSignal): Promise<Drop | null> {
  let response: Response
  try {
    response = await fetch(`${POAP_API_URL}/events/id/${eventId}`, {
      signal: abortSignal instanceof AbortSignal ? abortSignal : null,
      headers: {
        'x-api-key': POAP_API_KEY,
      },
    })
  } catch (err) {
    if (err.code === 20) {
      throw new AbortedError(`Fetch drop ${eventId} aborted`, { cause: err })
    }
    throw new Error(
      `Cannot fetch drop ${eventId}: response was not success (network error)`,
      { cause: err }
    )
  }

  if (response.status === 404) {
    return null
  }

  if (response.status === 400) {
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

    throw new HttpError(
      `Fetch drop '${eventId}' response was not success: ${message}`,
      { status: 400 }
    )
  }

  if (response.status !== 200) {
    throw new HttpError(
      `Fetch drop '${eventId}' response was not success ` +
      `(status ${response.status})`,
      { status: response.status }
    )
  }

  const body: unknown = await response.json()

  if (typeof body !== 'object') {
    throw new Error(`Malformed drop (type ${typeof body})`)
  }

  return parseDrop(body, includeDescription)
}

export async function eventLoader({ params, request }) {
  const force = new URL(request.url).searchParams.get('force') === 'true'

  try {
    const eventAndOwners = await getEventAndOwners(
      params.eventId,
      /*abortSignal*/undefined,
      /*includeDescription*/true,
      /*includeMetrics*/true,
      /*refresh*/force
    )
    if (eventAndOwners != null) {
      return {
        event: eventAndOwners.event,
        owners: eventAndOwners.owners,
        ts: eventAndOwners.ts,
        metrics: eventAndOwners.metrics,
      }
    }
  } catch (err) {
    console.error(err)
  }

  const event = await fetchEvent(params.eventId, /*includeDescription*/true)

  if (!event) {
    throw new Response('', {
      status: 404,
      statusText: 'Drop not found',
    })
  }

  const [tokensSettled, metricsSettled] = await Promise.allSettled([
    fetchPOAPs(params.eventId),
    getEventMetrics(params.eventId, null, /*refresh*/force),
  ])

  if (tokensSettled.status === 'rejected') {
    throw new Response('', {
      status: 503,
      statusText: 'Drop could not be fetch from POAP API',
    })
  }

  const tokens = tokensSettled.value
  const owners = filterInvalidOwners(
    tokens.map((token) => token.owner)
  )

  return {
    event,
    owners,
    ts: null,
    metrics: metricsSettled.status === 'fulfilled'
      ? metricsSettled.value
      : null,
  }
}

export async function eventsLoader({ params, request }) {
  const eventIds = parseEventIds(params.eventIds)

  if (eventIds.length === 0) {
    throw new Response('', {
      status: 404,
      statusText: 'Drops not found',
    })
  }

  if (params.eventIds !== eventIds.join(',')) {
    throw new Response('', {
      status: 301,
      statusText: 'Drops given unordered',
      headers: {
        location: `/events/${eventIds.join(',')}`,
      },
    })
  }

  if (eventIds.length === 1) {
    throw new Response('', {
      status: 301,
      statusText: 'One drop',
      headers: {
        location: `/event/${eventIds[0]}`,
      },
    })
  }

  const force = new URL(request.url).searchParams.get('force') === 'true'
  let events: Record<number, Drop | undefined>
  let notFoundEventIds: number[] | undefined

  if (!force) {
    try {
      events = await getEvents(eventIds)
    } catch (err) {
      console.error(err)
    }
    if (events) {
      notFoundEventIds = []

      for (const eventId of eventIds) {
        if (!(eventId in events)) {
          notFoundEventIds.push(eventId)
        }
      }

      if (notFoundEventIds.length === 0) {
        return events
      }
    }
  }

  if (!events) {
    events = {}
  }

  const [freshEvents, errors] = await fetchEventsOrErrors(
    notFoundEventIds ?? eventIds
  )

  if (Object.keys(errors).length > 0) {
    const errorsByEventId = Object.assign({}, errors)
    const eventsNotFound = await Promise.allSettled(
      Object.entries(errors)
        .filter(
          ([, error]) => error instanceof HttpError && error.status === 404
        )
        .map(([rawEventId]) =>
          fetchEvent(parseInt(rawEventId), /*includeDescription*/false)
        )
    )

    for (const eventResult of eventsNotFound) {
      if (eventResult.status === 'rejected') {
        continue
      }

      const event = eventResult.value

      if (!event) {
        continue
      }

      events[event.id] = event

      if (event.id in errors) {
        delete errorsByEventId[event.id]
      }
    }

    if (Object.keys(errorsByEventId).length > 0) {
      const response = JSON.stringify({
        errorsByEventId: Object.fromEntries(
          Object.entries(errorsByEventId).map(
            ([eventId, error]) => ([
              eventId,
              {
                message: error.message,
                status: error instanceof HttpError ? error.status : undefined,
              },
            ])
          )
        ),
      })

      throw new Response(response, {
        status: 503,
        statusText: 'Missing drops',
        headers: {
          'content-type': 'application/json',
        },
      })
    }
  }

  return {
    ...events,
    ...freshEvents,
  }
}
