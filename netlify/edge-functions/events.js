import axios from 'https://esm.sh/axios'

const FAMILY_URL = 'https://poap.family'
const FAMILY_API_URL = 'https://api.poap.family'

function getQueryString(requestUrl) {
  const searchParams = new URL(requestUrl).searchParams.toString()
  return searchParams ? `?${searchParams}` : ''
}

function parseEventIds(rawIds) {
  let eventIds = rawIds.split(',')
    .filter((value, index, all) => all.indexOf(value) === index)
    .map((value) => parseInt(value.trim()))
    .filter((eventId) => !isNaN(eventId))
  eventIds.sort((a, b) => a - b)
  return eventIds
}

function getRawEventIds(requestUrl) {
  const url = new URL(requestUrl)
  const [, rawEventIds] = url.pathname.match(/events\/([^/]+)/)
  return rawEventIds
}

async function getEventsInfo(eventIds) {
  const [events, owners, metrics] = await Promise.all([
    getEvents(eventIds),
    getOwners(eventIds),
    getMetrics(eventIds),
  ])
  const eventsInfo = {}
  for (const eventId of eventIds) {
    if (eventId in events) {
      eventsInfo[eventId] = {
        event: events[eventId],
        supply: eventId in owners ? owners[eventId].length : 0,
        emailReservations: eventId in metrics ? metrics[eventId].emailReservations : 0,
      }
    }
  }
  return eventsInfo
}

async function getEvents(eventIds) {
  const response = await axios.get(`${FAMILY_API_URL}/events/${eventIds.map((eventId) => encodeURIComponent(eventId)).join(',')}?fresh=true`)
  const events = response.data
  if (typeof events !== 'object') {
    throw new Error(`Events invalid response (type ${typeof events} expected object)`)
  }
  return events
}

async function getOwners(eventIds) {
  const response = await axios.get(`${FAMILY_API_URL}/events/${eventIds.map((eventId) => encodeURIComponent(eventId)).join(',')}/owners?fresh=true`)
  const owners = response.data
  if (typeof owners !== 'object') {
    throw new Error(`Events owners invalid response (type ${typeof owners} expected object)`)
  }
  return owners
}

async function getMetrics(eventIds) {
  const response = await axios.get(`${FAMILY_API_URL}/events/${eventIds.map((eventId) => encodeURIComponent(eventId)).join(',')}/metrics`)
  const metrics = response.data
  if (typeof metrics !== 'object') {
    throw new Error(`Events metrics invalid response (type ${typeof metrics} expected object)`)
  }
  return metrics
}

function replaceMeta(html, title, description, image, url) {
  return html
    .replace(/<title>([^<]+)<\/title>/, `<title>$1: ${title}</title>`)
    .replace(/<meta property="([^:]+):title" content="[^"]+" ?\/>/g, `<meta property="$1:title" content="${title}"/>`)
    .replace(/<meta name="description" content="[^"]+" ?\/>/, `<meta name="description" content="${description}"/>`)
    .replace(/<meta property="([^:]+):description" content="[^"]+" ?\/>/g, `<meta property="$1:description" content="${description}"/>`)
    .replace(/<meta property="([^:]+):image" content="[^"]+" ?\/>/g, `<meta property="$1:image" content="${image}"/>`)
    .replace(/<meta property="([^:]+):url" content="[^"]+" ?\/>/g, `<meta property="$1:url" content="${url}"/>`)
}

function escapeHtml(str) {
  return str
    .replace(/(\r\n|\n|\r)/gm, '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}

export default async function handler(request, context) {
  const rawEventIds = getRawEventIds(request.url)
  const queryString = getQueryString(request.url)

  const eventIds = parseEventIds(rawEventIds)

  const response = await context.next()
  const html = await response.text()

  if (eventIds.length === 0) {
    return new Response(html, {
      status: 404,
      headers: {
        'content-type': 'text/html',
      },
    })
  }

  if (rawEventIds !== eventIds.join(',')) {
    return Response.redirect(
      new URL(`/events/${eventIds.join(',')}${queryString}`, request.url)
    )
  }

  if (eventIds.length === 1) {
    return Response.redirect(
      new URL(`/event/${eventIds[0]}${queryString}`, request.url)
    )
  }

  let eventsInfo
  try {
    eventsInfo = await getEventsInfo(eventIds)
  } catch (err) {
    if (err?.response?.status === 404) {
      return new Response(html, {
        status: 404,
        headers: {
          'content-type': 'text/html',
        },
      })
    }
    return new Response(html, {
      status: 503,
      headers: {
        'content-type': 'text/html',
      },
    })
  }

  let totalSupply = 0
  let totalEmailReservations = 0
  let names = []
  for (const eventInfo of Object.values(eventsInfo)) {
    totalSupply += eventInfo.supply
    totalEmailReservations += eventInfo.emailReservations
    names = [...names, eventInfo.event.name]
  }

  const title = escapeHtml(names.join(', '))
  const description = escapeHtml(
    `[ ${totalSupply} + ${totalEmailReservations} ]`
  )
  const image = `${FAMILY_URL}/images/${eventIds.join(',')}`
  const url = `${FAMILY_URL}/events/${eventIds.join(',')}${queryString}`

  return new Response(
    replaceMeta(
      html,
      title,
      description,
      image,
      url
    ),
    response
  )
}

export const config = {
  path: '/events/*',
}
