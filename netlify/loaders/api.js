export async function getEventInfo(eventId, env) {
  if (!env.FAMILY_API_KEY) {
    return null
  }
  const response = await fetch(
    `${env.FAMILY_API_URL}/event/${eventId}?description=true&metrics=true&fresh=true&refresh=false`,
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
  return {
    event: body.event,
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
