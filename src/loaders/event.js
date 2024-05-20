import { filterInvalidOwners } from 'models/address'
import { DEFAULT_SEARCH_LIMIT, parseEventIds } from 'models/event'
import { Drop } from 'models/drop'
import { POAP_API_URL, POAP_API_KEY } from 'models/poap'
import { HttpError } from 'models/error'
import { getEventAndOwners, getEventMetrics, getEvents } from 'loaders/api'
import { fetchPOAPs } from 'loaders/poap'

/**
 * @param {string} query
 * @param {AbortSignal} [abortSignal]
 * @param {number} [offset]
 * @param {number} [limit]
 * @returns {Promise<{
 *   items: ReturnType<Drop>[]
 *   total: number
 *   offset: number
 *   limit: number
 * }>}
 */
export async function searchEvents(
  query,
  abortSignal,
  offset = 0,
  limit = DEFAULT_SEARCH_LIMIT,
) {
  const response = await fetch(
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

  if (response.status !== 200) {
    /**
     * @type {string | undefined}
     */
    let message
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

  const body = await response.json()

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
    items: body.items.map((item) => Drop(item, /*includeDescription*/false)),
    total: body.total,
    offset: body.offset,
    limit: body.limit,
  }
}

/**
 * @param {number[]} eventIds
 * @param {number} [limit]
 * @returns {Promise<[
 *   Record<number, ReturnType<Drop>>,
 *   Record<number, Error>,
 * ]>}
 */
export async function fetchEventsOrErrors(eventIds, limit = 100) {
  /**
   * @type {Record<number, ReturnType<Drop>>}
   */
  const eventsMap = {}

  /**
   * @type {Record<number, Error>}
   */
  const errorsMap = {}

  for (let i = 0; i < eventIds.length; i += limit) {
    const ids = eventIds.slice(i, i + limit)

    if (ids.length === 0) {
      break
    }

    /**
     * @type {Response | undefined}
     */
    let response
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
      console.error(err)

      for (const id of ids) {
        errorsMap[id] = new Error(`Response was not success (network error)`)
      }

      continue
    }

    if (response.status !== 200) {
      /**
       * @type {string | undefined}
       */
      let message
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
            `Response was not success (status ${response.status}): ${message}`,
            { status: response.status }
          )
        } else {
          errorsMap[id] = new HttpError(
            `Response was not success (status ${response.status})`,
            { status: response.status }
          )
        }
      }

      continue
    }

    try {
      const data = await response.json()
      if (
        data != null &&
        typeof data === 'object' &&
        'items' in data &&
        data.items != null &&
        Array.isArray(data.items)
      ) {
        for (const item of data.items) {
          const event = Drop(item, /*includeDescription*/false)
          eventsMap[event.id] = event
        }

        for (const id of ids) {
          if (!(id in eventsMap)) {
            errorsMap[id] = new HttpError(
              `Event '${id}' not found on response`,
              { status: 404 }
            )
          }
        }
      } else {
        for (const id of ids) {
          if (!(id in eventsMap)) {
            errorsMap[id] = new Error(`Malformed response event '${id}'`)
          }
        }
      }
    } catch (err) {
      console.error(err)

      for (const id of ids) {
        if (!(id in eventsMap)) {
          errorsMap[id] = new Error(`Malformed event '${id}': ${err.message}`)
        }
      }
    }
  }

  return [eventsMap, errorsMap]
}

/**
 * @param {number} eventId
 * @param {boolean} includeDescription
 * @param {AbortSignal} [abortSignal]
 * @returns {Promise<ReturnType<Drop> | null>}
 */
export async function fetchEvent(eventId, includeDescription, abortSignal) {
  const response = await fetch(`${POAP_API_URL}/events/id/${eventId}`, {
    signal: abortSignal instanceof AbortSignal ? abortSignal : null,
    headers: {
      'x-api-key': POAP_API_KEY,
    },
  })

  if (response.status === 404) {
    return null
  }

  if (response.status === 400) {
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

    throw new HttpError(
      `Fetch event '${eventId}' response was not success: ${message}`,
      { status: 400 }
    )
  }

  if (response.status !== 200) {
    throw new HttpError(
      `Fetch event '${eventId}' response was not success ` +
      `(status ${response.status})`,
      { status: response.status }
    )
  }

  const body = await response.json()

  if (typeof body !== 'object') {
    throw new Error(`Malformed event (type ${typeof body})`)
  }

  return Drop(body, includeDescription)
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
      statusText: 'Event not found',
    })
  }

  const [tokensSettled, metricsSettled] = await Promise.allSettled([
    fetchPOAPs(params.eventId),
    getEventMetrics(params.eventId, null, /*refresh*/force),
  ])

  if (tokensSettled.status === 'rejected') {
    throw new Response('', {
      status: 503,
      statusText: 'Event could not be fetch from POAP API',
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
      statusText: 'Events not found',
    })
  }

  if (params.eventIds !== eventIds.join(',')) {
    throw new Response('', {
      status: 301,
      statusText: 'Events given unordered',
      headers: {
        location: `/events/${eventIds.join(',')}`,
      },
    })
  }

  if (eventIds.length === 1) {
    throw new Response('', {
      status: 301,
      statusText: 'One event',
      headers: {
        location: `/event/${eventIds[0]}`,
      },
    })
  }

  const force = new URL(request.url).searchParams.get('force') === 'true'

  if (!force) {
    try {
      const events = await getEvents(eventIds)

      if (events) {
        /**
         * @type {number[]}
         */
        const notFoundEventIds = []

        for (const eventId of eventIds) {
          if (!(eventId in events)) {
            notFoundEventIds.push(eventId)
          }
        }

        if (notFoundEventIds.length > 0) {
          throw new Response(
            JSON.stringify({
              errorsByEventId: notFoundEventIds.reduce(
                (errorsByEventId, notFoundEventId) => ({
                  ...errorsByEventId,
                  [notFoundEventId]: {
                    message: `The event ${notFoundEventId} was not found`,
                    status: 404,
                    statusText: 'Event not found',
                  },
                }),
                {}
              ),
            }),
            {
              status: 503,
              statusText: 'Fetch events not found',
              headers: {
                'content-type': 'application/json',
              },
            }
          )
        }

        return events
      }
    } catch (err) {
      console.error(err)
    }
  }

  const [events, errors] = await fetchEventsOrErrors(eventIds)

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
        statusText: 'Fetch events failed',
        headers: {
          'content-type': 'application/json',
        },
      })
    }
  }

  return events
}
