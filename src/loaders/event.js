import { IGNORED_OWNERS } from '../models/address'
import { Event, parseEventIds } from '../models/event'
import { POAP_API_URL, POAP_API_KEY } from '../models/poap'
import { getEventAndOwners, getEventMetrics, getEvents, patchEvents, putEventAndOwners } from './api'
import { fetchPOAPs } from './poap'

async function searchEvents(query, abortSignal, offset = 0, limit = 10) {
  const response = await fetch(
    `${POAP_API_URL}/paginated-events?name=${encodeURIComponent(query)}&sort_field=start_date&sort_dir=desc&offset=${offset}&limit=${limit}`,
    {
      signal: abortSignal instanceof AbortSignal ? abortSignal : null,
      headers: {
        'x-api-key': POAP_API_KEY,
      },
    }
  )
  if (response.status !== 200) {
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
      throw new Error(`Search events was not success (status ${response.status}): ${message}`)
    } else {
      throw new Error(`Search events was not success (status ${response.status})`)
    }
  }
  let data
  try {
    const json = await response.json()
    if (json && typeof json === 'object' && 'items' in json && Array.isArray(json.items)) {
      data = json
    }
  } catch (err) {
    console.error(err)
    throw new Error(`Search events response JSON parse failed: ${err.message}`)
  }
  if (!data) {
    throw new Error(`Search events response was empty`)
  }
  if (
    !data || typeof data !== 'object' ||
    !('items' in data) || !Array.isArray(data.items) ||
    !('total' in data) || typeof data.total !== 'number' ||
    !('offset' in data) || typeof data.offset !== 'number' ||
    !('limit' in data) || typeof data.limit !== 'number'
  ) {
    throw new Error(`Search events response malformed`)
  }
  return {
    items: data.items.map((item) => Event(item)),
    total: data.total,
    offset: data.offset,
    limit: data.limit,
  }
}

async function fetchEventsOrErrors(eventIds, limit = 100) {
  const eventsMap = {}
  const errorsMap = {}
  for (let i = 0; i < eventIds.length; i += limit) {
    const ids = eventIds.slice(i, i + limit)
    if (ids.length === 0) {
      break
    }
    const response = await fetch(
      `${POAP_API_URL}/paginated-events?event_ids=${ids.map((eventId) => encodeURIComponent(eventId)).join(',')}&limit=${limit}`,
      {
        headers: {
          'x-api-key': POAP_API_KEY,
        },
      }
    )
    if (response.status !== 200) {
      let message
      try {
        const data = await response.json()
        if (typeof data === 'object' && 'message' in data) {
          message = data.message
        }
      } catch (err) {
        console.error(err)
      }
      for (const id of ids) {
        if (message) {
          errorsMap[id] = new Error(`Response was not success (status ${response.status}): ${message}`)
        } else {
          errorsMap[id] = new Error(`Response was not success (status ${response.status})`)
        }
      }
    } else {
      try {
        const data = await response.json()
        if (data && typeof data === 'object' && 'items' in data && Array.isArray(data.items)) {
          for (const item of data.items) {
            const event = Event(item)
            eventsMap[event.id] = event
          }
          for (const id of ids) {
            if (!(id in eventsMap)) {
              const error = new Error(`Event '${id}' not found on response`)
              error.status = 404
              error.statusText = 'Not Found'
              errorsMap[id] = error
            }
          }
        }
      } catch (err) {
        console.error(err)
        for (const id of ids) {
          if (!(id in eventsMap)) {
            errorsMap[id] = new Error(`Response JSON parse failed: ${err.message}`)
          }
        }
      }
    }
  }
  return [eventsMap, errorsMap]
}

async function fetchEvent(eventId, abortSignal) {
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
    const errorBody = await response.json()
    throw new Error(`Fetch event '${eventId}' response was not success: ${errorBody.message}`)
  }
  if (response.status !== 200) {
    throw new Error(`Fetch event '${eventId}' response was not success`)
  }
  return Event(
    await response.json()
  )
}

async function eventLoader({ params, request }) {
  const force = new URL(request.url).searchParams.get('force')
  if (!force) {
    try {
      const eventAndOwners = await getEventAndOwners(params.eventId, /*includeMetrics*/true)
      if (eventAndOwners) {
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
  }
  const event = await fetchEvent(params.eventId)
  if (!event) {
    throw new Response('', {
      status: 404,
      statusText: 'Event not found',
    })
  }
  const [tokensSettled, metricsSettled] = await Promise.allSettled([
    fetchPOAPs(params.eventId),
    getEventMetrics(params.eventId, null, /*refresh*/true),
  ])
  if (tokensSettled.status === 'rejected') {
    throw new Response('', {
      status: 503,
      statusText: 'Event could not be fetch from POAP API',
    })
  }
  const tokens = tokensSettled.value
  const owners = tokens.map((token) => token.owner.id)
  const uniqueOwners = owners.filter((value, index, all) => all.indexOf(value) === index)
  const filteredOwners = uniqueOwners.filter((owner) => !IGNORED_OWNERS.includes(owner))
  putEventAndOwners(event, filteredOwners)
  return {
    event,
    owners: filteredOwners,
    ts: null,
    metrics: metricsSettled.status === 'fulfilled' ? metricsSettled.value : {
      emailReservations: 0,
      emailClaimsMinted: 0,
      emailClaims: 0,
      momentsUploaded: 0,
      collectionsIncludes: 0,
      ts: null,
    },
  }
}

async function eventsLoader({ params, request }) {
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
  const force = new URL(request.url).searchParams.get('force')
  if (!force) {
    try {
      const events = await getEvents(eventIds)
      if (events) {
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
        .filter(([eventId, error]) => error.status === 404)
        .map(([eventId, error]) => fetchEvent(eventId))
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
                status: error.status,
                statusText: error.statusText,
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
  patchEvents(Object.values(events))
  return events
}

function eventRedirect({ params, request }) {
  const searchParams = new URL(request.url).searchParams.toString()
  return new Response('', {
    status: 301,
    statusText: 'Redirect to event',
    headers: {
      location: `/event/${params.eventId}${searchParams ? `?${searchParams}` : ''}`,
    },
  })
}

function eventsRedirect({ params, request }) {
  const searchParams = new URL(request.url).searchParams.toString()
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
        location: `/events/${eventIds.join(',')}${searchParams ? `?${searchParams}` : ''}`,
      },
    })
  }
  if (eventIds.length === 1) {
    throw new Response('', {
      status: 301,
      statusText: 'One event',
      headers: {
        location: `/event/${eventIds[0]}${searchParams ? `?${searchParams}` : ''}`,
      },
    })
  }
  return new Response('', {
    status: 301,
    statusText: 'Redirect to events',
    headers: {
      location: `/events/${params.eventIds}${searchParams ? `?${searchParams}` : ''}`,
    },
  })
}

export {
  searchEvents,
  fetchEvent,
  fetchEventsOrErrors,
  eventLoader,
  eventsLoader,
  eventRedirect,
  eventsRedirect,
}
