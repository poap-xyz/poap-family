import { getEnv } from '../loaders/env.js'
import { getEventInfo }  from '../loaders/api.js'
import { escapeHtml, replaceMeta } from '../utils/html.js'
import { encodeEvent, parseEventId } from '../utils/event.js'
import { appendFrame } from '../utils/frame.js'

function parseRequestUrl(requestUrl) {
  const url = new URL(requestUrl)
  const [, rawEventId] = url.pathname.match(/event\/([^/]+)/)
  const searchParams = url.searchParams.toString()
  return [rawEventId, searchParams ? `?${searchParams}` : '']
}

export default async function handler(request, context) {
  const response = await context.next()
  const html = await response.text()

  const [rawEventId, queryString] = parseRequestUrl(request.url)
  const eventId = parseEventId(rawEventId)
  const env = getEnv(context)

  if (String(eventId) !== String(rawEventId)) {
    return new Response(html, {
      status: 400,
      headers: {
        'content-type': 'text/html',
      },
    })
  }

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

  if (eventInfo == null) {
    return new Response(html, {
      status: 200,
      headers: {
        'content-type': 'text/html',
      },
    })
  }

  return new Response(
    appendFrame(
      replaceMeta(
        html,
        escapeHtml(eventInfo.event.name),
        escapeHtml(encodeEvent(eventInfo)),
        `${eventInfo.event.image_url}?size=large`,
        `${env.FAMILY_URL}/event/${eventId}${queryString}`
      ),
      env,
      [eventId],
      eventInfo.ts,
      `${env.FAMILY_URL}/event/${eventId}`
    ),
    response
  )
}

export const config = {
  path: '/event/*',
}
