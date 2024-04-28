import { getEnv } from '../loaders/env.js'
import { getEventInfo }  from '../loaders/api.js'
import { escapeHtml, replaceMeta } from '../utils/html.js'
import { encodeEvent } from '../utils/event.js'

function parseRequestUrl(requestUrl) {
  const url = new URL(requestUrl)
  const [, rawEventId] = url.pathname.match(/event\/([^/]+)/)
  const searchParams = url.searchParams.toString()
  return [rawEventId, searchParams ? `?${searchParams}` : '']
}

function getEventId(rawEventId) {
  const eventId = parseInt(rawEventId)
  if (isNaN(eventId)) {
    throw new Error(`Event invalid Id param`)
  }
  return eventId
}

export default async function handler(request, context) {
  const response = await context.next()
  const html = await response.text()

  const [rawEventId, queryString] = parseRequestUrl(request.url)
  const eventId = getEventId(rawEventId)
  const env = getEnv(context)

  let eventInfo
  try {
    eventInfo = await getEventInfo(eventId, env)
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

  return new Response(
    replaceMeta(
      html,
      escapeHtml(eventInfo.event.name),
      escapeHtml(encodeEvent(eventInfo)),
      `${eventInfo.event.image_url}?size=large`,
      `${env.FAMILY_URL}/event/${eventId}${queryString}`
    ),
    response
  )
}

export const config = {
  path: '/event/*',
}
