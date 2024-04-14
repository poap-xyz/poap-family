import axios from 'https://esm.sh/axios'
import dayjs from 'https://esm.sh/dayjs'
import localizedFormat from 'https://esm.sh/dayjs/plugin/localizedFormat'

dayjs.extend(localizedFormat)

const FAMILY_URL = 'https://poap.family'
const FAMILY_API_URL = 'https://api.poap.family'

function getQueryString(requestUrl) {
  const searchParams = new URL(requestUrl).searchParams.toString()
  return searchParams ? `?${searchParams}` : ''
}

function getEventId(requestUrl) {
  const url = new URL(requestUrl)
  const [, rawEventId] = url.pathname.match(/event\/([^/]+)/)
  const eventId = parseInt(rawEventId)
  if (isNaN(eventId)) {
    throw new Error(`Event invalid Id param`)
  }
  return eventId
}

async function getEventInfo(eventId) {
  const response = await axios.get(`${FAMILY_API_URL}/event/${eventId}?metrics=true&fresh=true`)
  const event = response.data
  if (
    typeof event !== 'object' ||
    !('event' in event) ||
    typeof event.event !== 'object' ||
    !('owners' in event) ||
    !Array.isArray(event.owners) ||
    !('metrics' in event) ||
    !('emailReservations' in event.metrics) ||
    typeof event.metrics.emailReservations !== 'number'
  ) {
    throw new Error(`Event ${eventId} invalid response`)
  }
  return {
    event: event.event,
    supply: event.owners.length,
    emailReservations: event.metrics.emailReservations,
  }
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
  const eventId = getEventId(request.url)
  const queryString = getQueryString(request.url)

  const response = await context.next()
  const html = await response.text()

  let eventInfo
  try {
    eventInfo = await getEventInfo(eventId)
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

  const title = escapeHtml(eventInfo.event.name)
  const description = escapeHtml(
    `[ ${eventInfo.supply} + ${eventInfo.emailReservations} ] ` +
    `${dayjs(eventInfo.event.start_date).format('ll')}` +
    `${eventInfo.event.city && eventInfo.event.country
        ? ` ${eventInfo.event.city}, ${eventInfo.event.country}`
        : ''
      }`
  )
  const image = eventInfo.event.image_url
  const url = `${FAMILY_URL}/event/${eventId}${queryString}`

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
  path: '/event/*',
}
