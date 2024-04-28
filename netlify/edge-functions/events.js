import { getEnv } from '../loaders/env.js'
import { getEventsInfo }  from '../loaders/api.js'
import { escapeHtml, replaceMeta } from '../utils/html.js'

function parseRequestUrl(requestUrl) {
  const url = new URL(requestUrl)
  const [, rawEventIds] = url.pathname.match(/events\/([^/]+)/)
  const searchParams = url.searchParams.toString()
  return [rawEventIds, searchParams ? `?${searchParams}` : '']
}

function getEventIds(rawIds) {
  let eventIds = rawIds.split(',')
    .filter((value, index, all) => all.indexOf(value) === index)
    .map((value) => parseInt(value.trim()))
    .filter((eventId) => !isNaN(eventId))
  eventIds.sort((a, b) => a - b)
  return eventIds
}

export default async function handler(request, context) {
  const response = await context.next()
  const html = await response.text()

  const [rawEventIds, queryString] = parseRequestUrl(request.url)
  const eventIds = getEventIds(rawEventIds)

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

  const env = getEnv(context)

  let eventsInfo
  try {
    eventsInfo = await getEventsInfo(eventIds, env)
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
  let totalReservations = 0
  let names = []
  for (const eventInfo of Object.values(eventsInfo)) {
    totalSupply += eventInfo.owners.length
    totalReservations += eventInfo.metrics?.emailReservations ?? 0
    names = [...names, eventInfo.event.name]
  }

  return new Response(
    replaceMeta(
      html,
      escapeHtml(names.join(', ')),
      escapeHtml(
        totalReservations > 0
          ? `[ ${totalSupply} + ${totalReservations} ]`
          : `[ ${totalSupply} ]`
      ),
      `${env.FAMILY_URL}/images/${eventIds.join(',')}`,
      `${env.FAMILY_URL}/events/${eventIds.join(',')}${queryString}`
    ),
    response
  )
}

export const config = {
  path: '/events/*',
}
