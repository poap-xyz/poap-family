const axios = require('axios')

const FAMILY_URL = 'https://poap.family'
const FAMILY_API_URL = 'https://api.poap.family'
const IS_BOT = /(bot|check|cloud|crawler|download|monitor|preview|scan|spider|google|qwantify|yahoo|facebookexternalhit|flipboard|tumblr|vkshare|whatsapp|curl|perl|python|wget|heritrix|ia_archiver)/i

async function getEventInfo(eventId) {
  const response = await axios.get(`${FAMILY_API_URL}/event/${eventId}?metrics=true&fresh=true`)
  const event = response.data
  if (
    typeof event !== 'object' ||
    !('event' in event) || typeof event.event !== 'object' ||
    !('owners' in event) || !Array.isArray(event.owners) ||
    !('ts' in event) || typeof event.ts !== 'number' ||
    !('metrics' in event) || !event.metrics ||
    !('emailReservations' in event.metrics) || typeof event.metrics.emailReservations !== 'number' ||
    !('ts' in event.metrics) || (typeof event.metrics.ts !== 'number' && event.metrics.ts !== null)
  ) {
    throw new Error(`Event ${eventId} invalid response`)
  }
  return {
    event: event.event,
    supply: event.owners.length,
    emailReservations: event.metrics.emailReservations,
  }
}

exports.defaults = async function(request, context) {
  const eventId = request.path.split('/').pop()

  if (!IS_BOT.test(request.headers['user-agent'])) {
    return new Response(null, {
      status: 301,
      headers: {
        location: `${FAMILY_URL}/r/event/${eventId}`,
      },
    })
  }

  let event, supply, emailReservations
  try {
    const eventInfo = await getEventInfo(eventId)
    event = eventInfo.event
    supply = eventInfo.supply
    emailReservations = eventInfo.emailReservations
  } catch (err) {
    if (err?.response?.status === 404) {
      return new Response(null, { status: 404 })
    }
    console.error('Fetch event info failed', err)
    return new Response(null, { status: 503 })
  }

  const description = `[ ${supply} + ${emailReservations} ] ${event.start_date}` +
    `${event.city && event.country ? ` ${event.city}, ${event.country}` : ''}`

  return new Response(`<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>POAP Family: ${event.name}</title>
    <link rel="shortcut icon" href="${FAMILY_URL}/favicon.ico">
    <meta name="theme-color" content="#B5AEFF">
    <meta name="description" content="Discover the POAPs that different collectors have in common">
    <meta property="og:site_name" content="POAP Family">
    <meta property="og:title" content="${event.name}">
    <meta property="og:description" content="${description}">
    <meta property="og:image" content="${event.image_url}">
    <meta property="og:url" content="${FAMILY_URL}/r/event/${eventId}">
    <meta property="twitter:card" content="summary">
    <meta property="twitter:site" content="@poapxyz">
    <meta property="twitter:title" content="${event.name}">
    <meta property="twitter:description" content="${description}">
    <meta property="twitter:image" content="${event.image_url}">
    <link rel="apple-touch-icon" href="${FAMILY_URL}/poap-family.png">
    <link rel="manifest" href="${FAMILY_URL}/manifest.json">
  </head>
  <body>
    <main>
      <h1>${event.name}</h1>
      <dl>
        <dt>Supply</dt>
        <dd>${supply}</dd>
        <dt>Email reservations</dt>
        <dd>${emailReservations}</dd>
      </dl>
      <p>${event.start_date}</p>${event.city && event.country ? `\n<p>${event.city}, ${event.country}</p>` : ''}
    </main>
  </body>
</html>`)
}
