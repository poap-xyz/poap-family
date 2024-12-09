import { filterInvalidOwners } from 'models/address'
import { parseEventIds } from 'models/event'
import { Drop } from 'models/drop'
import { HttpError } from 'models/error'
import { getEventAndOwners, getEventMetrics, getEvents } from 'loaders/api'
import { fetchPOAPs } from 'loaders/poap'
import { fetchDrop, fetchDropsOrErrors } from 'loaders/drop'

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
  } catch (err: unknown) {
    console.error(err)
  }

  const event = await fetchDrop(params.eventId, /*includeDescription*/true)

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
    } catch (err: unknown) {
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

  const [freshEvents, errors] = await fetchDropsOrErrors(
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
          fetchDrop(parseInt(rawEventId), /*includeDescription*/false)
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
