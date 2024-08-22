export function appendFrame(html, env, eventIds, ts) {
  const frameUrl = eventIds.length === 1
    ? `${env.FAMILY_API_URL}/event/${eventIds[0]}/image${ts && ts > 0 ? `?ts=${ts}` : ''}`
    : `${env.FAMILY_API_URL}/events/${eventIds.join(',')}/image${ts && ts > 0 ? `?ts=${ts}` : ''}`

  const frame =
    '\n<meta property="fc:frame" content="vNext"/>' +
    `\n<meta property="fc:frame:image" content="${frameUrl}"/>`

  return html.replace('</head>', `${frame}\n</head>`)
}
