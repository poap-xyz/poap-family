export interface Drop {
  id: number
  name: string
  description?: string
  image_url: string
  original_url: string
  city: string | null
  country: string | null
  start_date: string
  end_date: string
  expiry_date: string
}

export function parseDrop(event: unknown, includeDescription: boolean): Drop {
  if (
    event == null ||
    typeof event !== 'object' ||
    !('id' in event) ||
    event.id == null ||
    typeof event.id !== 'number' ||
    !('name' in event) ||
    event.name == null ||
    typeof event.name !== 'string' ||
    (
      includeDescription &&
      (
        !('description' in event) ||
        event.description == null ||
        typeof event.description !== 'string'
      )
    ) ||
    !('image_url' in event) ||
    event.image_url == null ||
    typeof event.image_url !== 'string' ||
    !('city' in event) ||
    (event.city != null && typeof event.city !== 'string') ||
    !('country' in event) ||
    (event.country != null && typeof event.country !== 'string') ||
    !('start_date' in event) ||
    event.start_date == null ||
    typeof event.start_date !== 'string' ||
    !('end_date' in event) ||
    event.end_date == null ||
    typeof event.end_date !== 'string' ||
    !('expiry_date' in event) ||
    event.expiry_date == null ||
    typeof event.expiry_date !== 'string'
  ) {
    throw new Error('Invalid drop')
  }
  return {
    id: event.id,
    name: event.name,
    description: includeDescription
      ? (
        'description' in event &&
        event.description != null &&
        typeof event.description === 'string'
          ? event.description
          : ''
      )
      : undefined,
    image_url: event.image_url,
    original_url: (
      'original_url' in event &&
      typeof event.original_url !== 'string'
        ? event.original_url
        : (
          'drop_image' in event &&
          event.drop_image != null &&
          typeof event.drop_image === 'object' &&
          'gateways' in event.drop_image &&
          event.drop_image.gateways != null &&
          Array.isArray(event.drop_image.gateways)
            ? event.drop_image?.gateways?.reduce(
                (original, gateway) => (
                  gateway != null &&
                  typeof gateway === 'object' &&
                  'type' in gateway &&
                  gateway.type != null &&
                  typeof gateway.type === 'string' &&
                  gateway.type === 'ORIGINAL' &&
                  'url' in gateway &&
                  gateway.url != null &&
                  typeof gateway.url === 'string'
                    ? gateway.url
                    : original
                ),
                event.image_url
              )
            : event.image_url
        )
    ),
    city: typeof event.city === 'string' ? event.city : null,
    country: typeof event.country === 'string' ? event.country : null,
    start_date: event.start_date,
    end_date: event.end_date,
    expiry_date: event.expiry_date,
  }
}

export interface DropOwners {
  owners: string[]
  ts: number
}

export function parseDropOwners(eventOwners: unknown): DropOwners {
  if (
    eventOwners == null ||
    typeof eventOwners !== 'object' ||
    !('owners' in eventOwners) ||
    !Array.isArray(eventOwners.owners) ||
    !eventOwners.owners.every((owner) =>
      owner != null &&
      typeof owner === 'string'
    ) ||
    !('ts' in eventOwners) ||
    eventOwners.ts == null ||
    typeof eventOwners.ts !== 'number'
  ) {
    throw new Error('Malformed drop owners')
  }
  return {
    owners: eventOwners.owners,
    ts: eventOwners.ts,
  }
}

export interface DropMetrics {
  emailReservations: number
  emailClaimsMinted: number
  emailClaims: number
  momentsUploaded: number
  collectionsIncludes: number
  ts: number
}

export function parseDropMetrics(eventMetrics: unknown): DropMetrics | null {
  if (eventMetrics == null) {
    return null
  }
  if (
    typeof eventMetrics === 'object' &&
    eventMetrics != null &&
    'emailReservations' in eventMetrics &&
    eventMetrics.emailReservations != null &&
    typeof eventMetrics.emailReservations === 'number' &&
    'emailClaimsMinted' in eventMetrics &&
    eventMetrics.emailClaimsMinted != null &&
    typeof eventMetrics.emailClaimsMinted === 'number' &&
    'emailClaims' in eventMetrics &&
    eventMetrics.emailClaims != null &&
    typeof eventMetrics.emailClaims === 'number' &&
    'momentsUploaded' in eventMetrics &&
    eventMetrics.momentsUploaded != null &&
    typeof eventMetrics.momentsUploaded === 'number' &&
    'collectionsIncludes' in eventMetrics &&
    eventMetrics.collectionsIncludes != null &&
    typeof eventMetrics.collectionsIncludes === 'number' &&
    'ts' in eventMetrics &&
    eventMetrics.ts != null &&
    typeof eventMetrics.ts === 'number'
  ) {
    return {
      emailReservations: eventMetrics.emailReservations,
      emailClaimsMinted: eventMetrics.emailClaimsMinted,
      emailClaims: eventMetrics.emailClaims,
      momentsUploaded: eventMetrics.momentsUploaded,
      collectionsIncludes: eventMetrics.collectionsIncludes,
      ts: eventMetrics.ts,
    }
  }
  if (
    typeof eventMetrics === 'object' &&
    eventMetrics != null &&
    'email_claims_stats' in eventMetrics &&
    'moments_stats' in eventMetrics &&
    'collections_items_aggregate' in eventMetrics &&
    eventMetrics.collections_items_aggregate != null &&
    typeof eventMetrics.collections_items_aggregate === 'object' &&
    'aggregate' in eventMetrics.collections_items_aggregate &&
    eventMetrics.collections_items_aggregate.aggregate != null &&
    typeof eventMetrics.collections_items_aggregate.aggregate === 'object' &&
    'count' in eventMetrics.collections_items_aggregate.aggregate &&
    eventMetrics.collections_items_aggregate.aggregate.count != null &&
    typeof eventMetrics.collections_items_aggregate.aggregate.count === 'number'
  ) {
    let emailReservations = 0;
    let emailClaimsMinted = 0;
    let emailClaims = 0;
    if (
      eventMetrics.email_claims_stats != null &&
      typeof eventMetrics.email_claims_stats === 'object' &&
      'minted' in eventMetrics.email_claims_stats &&
      eventMetrics.email_claims_stats.minted != null &&
      typeof eventMetrics.email_claims_stats.minted === 'number' &&
      'reserved' in eventMetrics.email_claims_stats &&
      eventMetrics.email_claims_stats.reserved != null &&
      typeof eventMetrics.email_claims_stats.reserved === 'number' &&
      'total' in eventMetrics.email_claims_stats &&
      eventMetrics.email_claims_stats.total != null &&
      typeof eventMetrics.email_claims_stats.total === 'number'
    ) {
      emailReservations = eventMetrics.email_claims_stats.reserved;
      emailClaimsMinted = eventMetrics.email_claims_stats.minted;
      emailClaims = eventMetrics.email_claims_stats.total;
    }
    let momentsUploaded = 0;
    if (
      eventMetrics.moments_stats != null &&
      typeof eventMetrics.moments_stats === 'object' &&
      'moments_uploaded' in eventMetrics.moments_stats &&
      eventMetrics.moments_stats.moments_uploaded != null &&
      typeof eventMetrics.moments_stats.moments_uploaded === 'number'
    ) {
      momentsUploaded = eventMetrics.moments_stats.moments_uploaded;
    }
    return {
      emailReservations,
      emailClaimsMinted,
      emailClaims,
      momentsUploaded,
      collectionsIncludes:
        eventMetrics.collections_items_aggregate.aggregate.count,
      ts: Date.now(),
    }
  }
  throw new Error('Malformed drop metrics')
}

export function parseDropData(
  data: unknown,
  includeDescription: boolean = false,
  includeMetrics: boolean = true,
): {
  event: Drop
  owners: string[]
  ts: number | null
  metrics: DropMetrics | null
} {
  if (
    data == null ||
    typeof data !== 'object' ||
    !('event' in data) ||
    !('owners' in data) ||
    !('ts' in data)
  ) {
    throw new Error('Malformed drop data')
  }
  let dropOwners: DropOwners
  if (data.ts == null) {
    if (
      !Array.isArray(data.owners) ||
      !data.owners.every((owner) =>
        owner != null &&
        typeof owner === 'string'
      )
    ) {
      throw new Error('Malformed owners')
    }
    dropOwners = {
      owners: data.owners,
      ts: null,
    }
  } else {
    dropOwners = parseDropOwners({
      owners: data.owners,
      ts: data.ts,
    })
  }
  if (!includeMetrics) {
    return {
      event: parseDrop(data.event, includeDescription),
      owners: dropOwners.owners,
      ts: dropOwners.ts,
      metrics: null,
    }
  }
  if (!('metrics' in data)) {
    throw new Error('Malformed drop data')
  }
  return {
    event: parseDrop(data.event, includeDescription),
    owners: dropOwners.owners,
    ts: dropOwners.ts,
    metrics: parseDropMetrics(data.metrics),
  }
}

export function parseDrops(
  drops: unknown,
  includeDescription: boolean = false,
): Record<number, Drop> {
  if (drops == null || typeof drops !== 'object') {
    throw new Error('Invalid drops')
  }

  return Object.fromEntries(
    Object.entries(drops).map(
      ([eventId, event]) => [eventId, parseDrop(event, includeDescription)]
    )
  )
}
