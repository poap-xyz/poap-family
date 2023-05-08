const axios = require('axios')

const FAMILY_URL = 'https://poap.family'
const FAMILY_API_URL = 'https://api.poap.family'
const IS_BOT = /(bot|check|cloud|crawler|download|monitor|preview|scan|spider|google|qwantify|yahoo|facebookexternalhit|flipboard|tumblr|vkshare|whatsapp|curl|perl|python|wget|heritrix|ia_archiver)/i

function parseEventIds(rawIds) {
  let eventIds = rawIds.split(',')
    .filter((value, index, all) => all.indexOf(value) === index)
    .map((value) => parseInt(value.trim()))
    .filter((eventId) => !isNaN(eventId))
  eventIds.sort((a, b) => a - b)
  return eventIds
}

async function getEventsInfo(eventIds) {
  const [events, owners, metrics] = await Promise.all([
    getEvents(eventIds),
    getOwners(eventIds),
    getMetrics(eventIds),
  ])
  if (!events) {
    return null
  }
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
  const response = await axios.get(`${FAMILY_API_URL}/events/${eventIds.map((eventId) => encodeURIComponent(eventId)).join(',')}`)
  const events = response.data
  if (typeof events !== 'object') {
    throw new Error(`Events invalid response (type ${typeof events} expected object)`)
  }
  return events
}

async function getOwners(eventIds) {
  const response = await axios.get(`${FAMILY_API_URL}/events/${eventIds.map((eventId) => encodeURIComponent(eventId)).join(',')}/owners`)
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

exports.handler = async function(request, context, callback) {
  const rawIds = request.path.split('/').pop()
  const eventIds = parseEventIds(rawIds)

  if (!IS_BOT.test(request.headers['user-agent'])) {
    return {
      statusCode: 301,
      headers: {
        location: `${FAMILY_URL}/r/events/${eventIds.join(',')}`,
      },
    }
  }

  let eventsInfo
  try {
    eventsInfo = await getEventsInfo(eventIds)
  } catch (err) {
    if (err?.response?.status === 404) {
      return { statusCode: 404 }
    }
    console.error('Fetch events info failed', err)
    return { statusCode: 503 }
  }

  let totalSupply = 0, totalEmailReservations = 0
  let titles = [], trs = []
  for (const { event, supply, emailReservations } of Object.values(eventsInfo)) {
    totalSupply += supply
    totalEmailReservations += emailReservations
    titles.push(event.name)
    trs.push(`<tr><td><h3>${event.name}</h3><p>${event.start_date}</p>${event.city && event.country ? `<p>${event.city}, ${event.country}</p>` : ''}</td><td>${supply}</td><td>${emailReservations}</td></tr>`)
  }

  return {
    statusCode: 200,
    body: `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>POAP Family: ${titles.join(', ')}</title>
    <link rel="shortcut icon" href="${FAMILY_URL}/favicon.ico">
    <meta name="theme-color" content="#B5AEFF">
    <meta name="description" content="Discover the POAPs that different collectors have in common">
    <meta property="og:site_name" content="POAP Family">
    <meta property="og:title" content="${titles.join(', ')}">
    <meta property="og:description" content="[ ${totalSupply} + ${totalEmailReservations} ]">
    <meta property="og:image" content="${FAMILY_URL}/poap-family.png"><!-- FIXME -->
    <meta property="og:url" content="${FAMILY_URL}/r/events/${eventIds.join(',')}">
    <meta property="twitter:card" content="summary">
    <meta property="twitter:site" content="@poapxyz">
    <meta property="twitter:title" content="${titles.join(', ')}">
    <meta property="twitter:description" content="[ ${totalSupply} + ${totalEmailReservations} ]">
    <meta property="twitter:image" content="${FAMILY_URL}/poap-family.png"><!-- FIXME -->
    <link rel="apple-touch-icon" href="${FAMILY_URL}/poap-family.png">
    <link rel="manifest" href="${FAMILY_URL}/manifest.json">
  </head>
  <body>
    <article>
      <h1>${titles.join(', ')}</h1>
      <dl>
        <dt>Total supply</dt>
        <dd>${totalSupply}</dd>
        <dt>Total email reservations</dt>
        <dd>${totalEmailReservations}</dd>
      </dl>
      <table>
        <tr><th>Event</th><th>Supply</th><th>Email reservations</th></tr>
        ${trs.join('')}
      </table>
    </article>
  </body>
</html>`,
  }
}
