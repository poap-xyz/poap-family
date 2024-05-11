export async function getEventInfo(eventId, env) {
  if (!env.FAMILY_API_KEY) {
    throw new Error(
      `Event ${eventId} could not be fetched, ` +
      `configure Family API key`
    )
  }
  const response = await fetch(
    `${env.FAMILY_API_URL}/event/${eventId}?description=false&metrics=true`,
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
    throw new Error(
      `Event ${eventId} failed to fetch (status ${response.status})`
    )
  }
  const body = await response.json()
  if (typeof body !== 'object') {
    throw new Error(`Malformed events (type ${typeof body})`)
  }
  return body
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
    throw new Error(
      `Events (${eventIds.length}) could not be fetched, ` +
      `configure Family API key`
    )
  }
  const response = await fetch(
    `${env.FAMILY_API_URL}/events` +
    `/${eventIds.map((eventId) => encodeURIComponent(eventId)).join(',')}`,
    {
      headers: {
        'x-api-key': env.FAMILY_API_KEY,
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
      throw new Error(
        `Events (${eventIds.length}) failed to fetch ` +
        `(status ${response.status}): ${message}`
      )
    }
    throw new Error(
      `Events (${eventIds.length}) failed to fetch ` +
      `(status ${response.status})`
    )
  }
  const body = await response.json()
  if (typeof body !== 'object') {
    throw new Error(`Malformed events (type ${typeof body})`)
  }
  return body
}

export async function getEventsOwners(eventIds, env) {
  if (!env.FAMILY_API_KEY) {
    throw new Error(
      `Events (${eventIds.length}) owners could not be fetched, ` +
      `configure Family API key`
    )
  }
  const response = await fetch(
    `${env.FAMILY_API_URL}/events` +
      `/${eventIds.map((eventId) => encodeURIComponent(eventId)).join(',')}` +
      `/owners`,
    {
      headers: {
        'x-api-key': env.FAMILY_API_KEY,
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
      throw new Error(
        `Events (${eventIds.length}) failed to fetch owners ` +
        `(status ${response.status}): ${message}`
      )
    }
    throw new Error(
      `Events (${eventIds.length}) failed to fetch owners ` +
      `(status ${response.status})`
    )
  }
  const body = await response.json()
  if (typeof body !== 'object') {
    throw new Error(`Malformed events owners (type ${typeof body})`)
  }
  return body
}

export async function getEventsMetrics(eventIds, env) {
  if (!env.FAMILY_API_KEY) {
    throw new Error(
      `Events (${eventIds.length}) metrics could not be fetched, ` +
      `configure Family API key`
    )
  }
  const response = await fetch(
    `${env.FAMILY_API_URL}/events` +
    `/${eventIds.map((eventId) => encodeURIComponent(eventId)).join(',')}/metrics`,
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
      throw new Error(
        `Events (${eventIds.length}) failed to fetch metrics ` +
        `(status ${response.status}): ${message}`
      )
    }
    throw new Error(
      `Events (${eventIds.length}) failed to fetch metrics ` +
      `(status ${response.status})`
    )
  }
  const body = await response.json()
  if (typeof body !== 'object') {
    throw new Error(`Malformed events metrics (type ${typeof body})`)
  }
  return body
}
