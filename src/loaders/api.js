import axios from 'axios'
import { FAMILY_API_KEY, FAMILY_API_URL } from '../models/api'
import { encodeExpiryDates, Event, EventOwners } from '../models/event'

async function getEventAndOwners(
  eventId,
  abortSignal,
  includeDescription = false,
  includeMetrics = true,
  refresh = false,
) {
  if (!FAMILY_API_KEY) {
    return null
  }
  const response = await fetch(
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
  if (!includeMetrics) {
    return {
      event: Event(body.event, includeDescription),
      owners: body.owners,
      ts: body.ts,
    }
  }
  if (
    !('metrics' in body) || !body.metrics || typeof body.metrics !== 'object' ||
    !('emailReservations' in body.metrics) || typeof body.metrics.emailReservations !== 'number' ||
    !('emailClaimsMinted' in body.metrics) || typeof body.metrics.emailClaimsMinted !== 'number' ||
    !('emailClaims' in body.metrics) || typeof body.metrics.emailClaims !== 'number' ||
    !('momentsUploaded' in body.metrics) || typeof body.metrics.momentsUploaded !== 'number' ||
    !('collectionsIncludes' in body.metrics) || typeof body.metrics.collectionsIncludes !== 'number' ||
    !('ts' in body.metrics) || (typeof body.metrics.ts !== 'number' && body.metrics.ts !== null)
  ) {
    return {
      event: Event(body.event, includeDescription),
      owners: body.owners,
      ts: body.ts,
      metrics: {
        emailReservations: 0,
        emailClaimsMinted: 0,
        emailClaims: 0,
        momentsUploaded: 0,
        collectionsIncludes: 0,
        ts: null,
      },
    }
  }
  return {
    event: Event(body.event, includeDescription),
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

async function putEventInCommon(eventId, inCommon) {
  if (!FAMILY_API_KEY) {
    return
  }
  const response = await fetch(`${FAMILY_API_URL}/event/${eventId}/in-common`, {
    method: 'PUT',
    headers: {
      'x-api-key': FAMILY_API_KEY,
      'content-type': 'application/json',
    },
    body: JSON.stringify(inCommon),
  })
  if (response.status !== 200 && response.status !== 201) {
    throw new Error(`Event ${eventId} in common save failed (status ${response.status})`)
  }
}

async function getInCommonEvents(eventId, abortSignal) {
  if (!FAMILY_API_KEY) {
    return null
  }
  const response = await fetch(`${FAMILY_API_URL}/event/${eventId}/in-common`, {
    signal: abortSignal instanceof AbortSignal ? abortSignal : null,
    headers: {
      'x-api-key': FAMILY_API_KEY,
    },
  })
  if (response.status === 404) {
    return null
  }
  if (response.status !== 200) {
    throw new Error(`Event ${eventId} in common failed to fetch (status ${response.status})`)
  }
  const body = await response.json()
  if (
    typeof body !== 'object' ||
    !('inCommon' in body) || typeof body.inCommon !== 'object' ||
    !('events' in body) || typeof body.events !== 'object' ||
    !('ts' in body) || typeof body.ts !== 'number'
  ) {
    return null
  }
  return {
    inCommon: body.inCommon,
    events: Object.fromEntries(
      Object.entries(body.events).map(
        ([eventId, event]) => ([eventId, Event(event)])
      )
    ),
    ts: body.ts,
  }
}

async function getInCommonEventsWithProgress(eventId, abortSignal, onProgress) {
  if (!FAMILY_API_KEY) {
    return null
  }
  try {
    const response = await axios.get(`${FAMILY_API_URL}/event/${eventId}/in-common`, {
      signal: abortSignal instanceof AbortSignal ? abortSignal : undefined,
      onDownloadProgress: onProgress,
      headers: {
        'x-api-key': FAMILY_API_KEY,
      },
    })
    if (response.status === 404) {
      return null
    }
    if (response.status !== 200) {
      throw new Error(`Event ${eventId} in common failed to fetch (status ${response.status})`)
    }
    if (
      typeof response.data !== 'object' ||
      !('inCommon' in response.data) || typeof response.data.inCommon !== 'object' ||
      !('events' in response.data) || typeof response.data.events !== 'object' ||
      !('ts' in response.data) || typeof response.data.ts !== 'number'
    ) {
      return null
    }
    return {
      inCommon: response.data.inCommon,
      events: Object.fromEntries(
        Object.entries(response.data.events).map(
          ([eventId, event]) => ([eventId, Event(event)])
        )
      ),
      ts: response.data.ts,
    }
  } catch (err) {
    if (err.response) {
      if (err.response.status === 404) {
        return null
      }
      throw new Error(`Event ${eventId} in common failed to fetch (status ${err.response.status})`)
    }
    throw new Error(`Event ${eventId} in common failed to fetch`)
  }
}

async function getLastEvents(page = 1, qty = 3) {
  if (!FAMILY_API_KEY) {
    return null
  }
  const response = await fetch(`${FAMILY_API_URL}/events/last?page=${encodeURIComponent(page)}&qty=${encodeURIComponent(qty)}`, {
    headers: {
      'x-api-key': FAMILY_API_KEY,
    },
  })
  if (response.status !== 200) {
    throw new Error(`Last events failed to fetch (status ${response.status})`)
  }
  const body = await response.json()
  if (
    typeof body !== 'object' ||
    !('lastEvents' in body) || !Array.isArray(body.lastEvents)
    || !('pages' in body) || typeof body.pages !== 'number'
    || !('total' in body) || typeof body.total !== 'number'
  ) {
    return null
  }
  return {
    pages: body.pages,
    total: body.total,
    lastEvents: body.lastEvents,
  }
}

async function getEvents(eventIds) {
  if (!FAMILY_API_KEY) {
    return null
  }
  const response = await fetch(
    `${FAMILY_API_URL}/events/${eventIds.map((eventId) => encodeURIComponent(eventId)).join(',')}`,
    {
      headers: {
        'x-api-key': FAMILY_API_KEY,
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
      ([eventId, event]) => [eventId, Event(event)]
    )
  )
}

async function getEventsOwners(eventIds, abortSignal, expiryDates) {
  if (!FAMILY_API_KEY) {
    return null
  }
  const queryString = expiryDates ? encodeExpiryDates(expiryDates) : ''
  const response = await fetch(
    `${FAMILY_API_URL}/events` +
      `/${eventIds.map((eventId) => encodeURIComponent(eventId)).join(',')}` +
      `/owners${queryString ? `?${queryString}` : ''}`,
    {
      signal: abortSignal instanceof AbortSignal ? abortSignal : null,
      headers: {
        'x-api-key': FAMILY_API_KEY,
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
      throw new Error(`Events (${eventIds.length}) failed to fetch owners (status ${response.status}): ${message}`)
    }
    throw new Error(`Events (${eventIds.length}) failed to fetch owners (status ${response.status})`)
  }
  const body = await response.json()
  if (typeof body !== 'object') {
    return null
  }
  return Object.fromEntries(
    Object.entries(body).map(
      ([eventId, event]) => [eventId, EventOwners(event)]
    )
  )
}

async function getEventMetrics(eventId, abortSignal, refresh = false) {
  if (!FAMILY_API_KEY) {
    throw new Error(`Event ${eventId} metrics could not be fetched, configure Family API key`)
  }
  const response = await fetch(
    `${FAMILY_API_URL}/event/${eventId}/metrics${refresh ? '?refresh=true' : ''}`,
    {
      signal: abortSignal instanceof AbortSignal ? abortSignal : null,
      headers: {
        'x-api-key': FAMILY_API_KEY,
      },
    }
  )
  if (response.status === 404) {
    return null
  }
  if (response.status !== 200) {
    throw new Error(`Event ${eventId} failed to fetch metrics (status ${response.status})`)
  }
  const metrics = await response.json()
  if (
    !metrics ||
    typeof metrics !== 'object' ||
    !('emailReservations' in metrics) || typeof metrics.emailReservations !== 'number' ||
    !('emailClaimsMinted' in metrics) || typeof metrics.emailClaimsMinted !== 'number' ||
    !('emailClaims' in metrics) || typeof metrics.emailClaims !== 'number' ||
    !('momentsUploaded' in metrics) || typeof metrics.momentsUploaded !== 'number' ||
    !('collectionsIncludes' in metrics) || typeof metrics.collectionsIncludes !== 'number' ||
    !('ts' in metrics) || (typeof metrics.ts !== 'number' && metrics.ts !== null)
  ) {
    return null
  }
  return {
    emailReservations: metrics.emailReservations,
    emailClaimsMinted: metrics.emailClaimsMinted,
    emailClaims: metrics.emailClaims,
    momentsUploaded: metrics.momentsUploaded,
    collectionsIncludes: metrics.collectionsIncludes,
    ts: metrics.ts,
  }
}

async function getEventsMetrics(eventIds, abortSignal) {
  if (!FAMILY_API_KEY) {
    throw new Error(`Events (${eventIds.length}) metrics could not be fetched, configure Family API key`)
  }
  const response = await fetch(
    `${FAMILY_API_URL}/events/${eventIds.map((eventId) => encodeURIComponent(eventId)).join(',')}/metrics`,
    {
      signal: abortSignal instanceof AbortSignal ? abortSignal : null,
      headers: {
        'x-api-key': FAMILY_API_KEY,
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

async function auth(passphrase) {
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

async function addFeedback(message, url) {
  const response = await fetch(`${FAMILY_API_URL}/feedback`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify({ feedback: message, location: url }),
  })
  if (response.status !== 200 && response.status !== 201) {
    throw new Error(`Feedback save failed (status ${response.status})`)
  }
}

async function getFeedback(passphrase, page = 1, qty = 3) {
  const response = await fetch(`${FAMILY_API_URL}/feedback?page=${encodeURIComponent(page)}&qty=${encodeURIComponent(qty)}`, {
    headers: {
      'x-api-key': passphrase,
    },
  })
  if (response.status !== 200) {
    throw new Error(`Feedback failed to fetch`)
  }
  const body = await response.json()
  if (
    typeof body !== 'object' ||
    !('feedback' in body) || !Array.isArray(body.feedback)
    || !('pages' in body) || typeof body.pages !== 'number'
    || !('total' in body) || typeof body.total !== 'number'
  ) {
    return null
  }
  return {
    pages: body.pages,
    total: body.total,
    feedback: body.feedback,
  }
}

async function delFeedback(id, passphrase) {
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

export {
  getEventAndOwners,
  putEventInCommon,
  getInCommonEventsWithProgress,
  getInCommonEvents,
  getLastEvents,
  getEvents,
  getEventsOwners,
  getEventMetrics,
  getEventsMetrics,
  auth,
  addFeedback,
  getFeedback,
  delFeedback,
}
