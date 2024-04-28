export async function getEventInfo(eventId, env) {
  if (!env.FAMILY_API_KEY) {
    return null
  }
  const response = await fetch(
    `${env.FAMILY_API_URL}/event/${eventId}?description=true&metrics=true&fresh=true&refresh=false`,
    {
      headers: {
        'x-api-key': env.FAMILY_API_KEY,
      },
    }
  )
  if (response.status === 404) {
    return null
  }
  if (response.status !== 200) {
    throw new Error(`Event ${eventId} failed to fetch (status ${response.status})`)
  }
  const body = await response.json()
  if (
    typeof body !== 'object' ||
    !('event' in body) || typeof body.event !== 'object' ||
    !('owners' in body) || !Array.isArray(body.owners) ||
    !('ts' in body) || typeof body.ts !== 'number'
  ) {
    return null
  }
  return {
    event: body.event,
    owners: body.owners,
    ts: body.ts,
    metrics: {
      emailReservations: body.metrics.emailReservations,
      emailClaimsMinted: body.metrics.emailClaimsMinted,
      emailClaims: body.metrics.emailClaims,
      momentsUploaded: body.metrics.momentsUploaded,
      collectionsIncludes: body.metrics.collectionsIncludes,
      ts: body.metrics.ts,
    },
  }
}

export async function getEventsInfo(eventIds, env) {
  const [events, owners, metrics] = await Promise.all([
    getEvents(eventIds, env),
    getEventsOwners(eventIds, env),
    getEventsMetrics(eventIds, env),
  ])
  const eventsInfo = {}
  for (const eventId of eventIds) {
    if (eventId in events) {
      eventsInfo[eventId] = {
        event: events[eventId],
        owners: owners[eventId],
        metrics: metrics[eventId],
      }
    }
  }
  return eventsInfo
}

export async function getEvents(eventIds, env) {
  if (!env.FAMILY_API_KEY) {
    return null
  }
  const response = await fetch(
    `${env.FAMILY_API_URL}/events/${eventIds.map((eventId) => encodeURIComponent(eventId)).join(',')}?fresh=true`,
    {
      headers: {
        'x-api-key': env.FAMILY_API_KEY,
      },
    }
  )
  if (response.status === 404) {
    return null
  }
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
      throw new Error(`Events (${eventIds.length}) failed to fetch (status ${response.status}): ${message}`)
    }
    throw new Error(`Events (${eventIds.length}) failed to fetch (status ${response.status})`)
  }
  const body = await response.json()
  if (typeof body !== 'object') {
    return null
  }
  return Object.fromEntries(
    Object.entries(body).map(
      ([eventId, event]) => [eventId, event]
    )
  )
}

export async function getEventsOwners(eventIds, env) {
  if (!env.FAMILY_API_KEY) {
    return null
  }
  const response = await fetch(
    `${env.FAMILY_API_URL}/events` +
      `/${eventIds.map((eventId) => encodeURIComponent(eventId)).join(',')}/owners?fresh=true`,
    {
      headers: {
        'x-api-key': env.FAMILY_API_KEY,
      },
    }
  )
  if (response.status === 404) {
    return null
  }
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
      throw new Error(`Events (${eventIds.length}) failed to fetch owners (status ${response.status}): ${message}`)
    }
    throw new Error(`Events (${eventIds.length}) failed to fetch owners (status ${response.status})`)
  }
  const body = await response.json()
  if (typeof body !== 'object') {
    return null
  }
  return body
}

export async function getEventsMetrics(eventIds, env) {
  if (!env.FAMILY_API_KEY) {
    throw new Error(`Events (${eventIds.length}) metrics could not be fetched, configure Family API key`)
  }
  const response = await fetch(`${env.FAMILY_API_URL}/events/${eventIds.map((eventId) => encodeURIComponent(eventId)).join(',')}/metrics`, {
    headers: {
      'x-api-key': env.FAMILY_API_KEY,
    },
  })
  if (response.status === 404) {
    return null
  }
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
      throw new Error(`Events (${eventIds.length}) failed to fetch metrics (status ${response.status}): ${message}`)
    }
    throw new Error(`Events (${eventIds.length}) failed to fetch metrics (status ${response.status})`)
  }
  const metricsMap = await response.json()
  if (typeof metricsMap !== 'object') {
    return null
  }
  return metricsMap
}
