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

export function parseDrop(data: unknown, includeDescription: boolean): Drop {
  if (
    data == null ||
    typeof data !== 'object' ||
    !('id' in data) ||
    data.id == null ||
    typeof data.id !== 'number' ||
    !('name' in data) ||
    data.name == null ||
    typeof data.name !== 'string' ||
    (
      includeDescription &&
      (
        !('description' in data) ||
        data.description == null ||
        typeof data.description !== 'string'
      )
    ) ||
    !('image_url' in data) ||
    data.image_url == null ||
    typeof data.image_url !== 'string' ||
    !('city' in data) ||
    (data.city != null && typeof data.city !== 'string') ||
    !('country' in data) ||
    (data.country != null && typeof data.country !== 'string') ||
    !('start_date' in data) ||
    data.start_date == null ||
    typeof data.start_date !== 'string' ||
    !('end_date' in data) ||
    data.end_date == null ||
    typeof data.end_date !== 'string' ||
    !('expiry_date' in data) ||
    data.expiry_date == null ||
    typeof data.expiry_date !== 'string'
  ) {
    throw new Error('Malformed drop')
  }
  return {
    id: data.id,
    name: data.name,
    description: includeDescription
      ? (
        'description' in data &&
        data.description != null &&
        typeof data.description === 'string'
          ? data.description
          : ''
      )
      : undefined,
    image_url: data.image_url,
    original_url: (
      'original_url' in data &&
      typeof data.original_url !== 'string'
        ? data.original_url
        : (
          'drop_image' in data &&
          data.drop_image != null &&
          typeof data.drop_image === 'object' &&
          'gateways' in data.drop_image &&
          data.drop_image.gateways != null &&
          Array.isArray(data.drop_image.gateways)
            ? data.drop_image?.gateways?.reduce(
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
                data.image_url
              )
            : data.image_url
        )
    ),
    city: typeof data.city === 'string' ? data.city : null,
    country: typeof data.country === 'string' ? data.country : null,
    start_date: data.start_date,
    end_date: data.end_date,
    expiry_date: data.expiry_date,
  }
}

export interface DropMetrics {
  mints: number
  emailReservations: number
  emailClaimsMinted: number
  emailClaims: number
  momentsUploaded: number
  collectionsIncludes: number
}

export function parseDropMetrics(eventMetrics: unknown): DropMetrics | null {
  if (eventMetrics == null) {
    return null
  }
  if (
    typeof eventMetrics === 'object' &&
    eventMetrics != null &&
    'poaps_aggregate' in eventMetrics &&
    eventMetrics.poaps_aggregate != null &&
    typeof eventMetrics.poaps_aggregate === 'object' &&
    'aggregate' in eventMetrics.poaps_aggregate &&
    eventMetrics.poaps_aggregate.aggregate != null &&
    typeof eventMetrics.poaps_aggregate.aggregate === 'object' &&
    'count' in eventMetrics.poaps_aggregate.aggregate &&
    eventMetrics.poaps_aggregate.aggregate.count != null &&
    typeof eventMetrics.poaps_aggregate.aggregate.count === 'number' &&
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
      mints: eventMetrics.poaps_aggregate.aggregate.count,
      emailReservations,
      emailClaimsMinted,
      emailClaims,
      momentsUploaded,
      collectionsIncludes:
        eventMetrics.collections_items_aggregate.aggregate.count,
    }
  }
  throw new Error('Malformed drop metrics')
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
      ([rawDropId, drop]) => [rawDropId, parseDrop(drop, includeDescription)]
    )
  )
}

export interface DropPower {
  dropId: number
  power: number
}

export function parseDropIds(rawIds?: string): number[] {
  let dropIds = (rawIds ?? '').split(',')
    .filter((value, index, all) => all.indexOf(value) === index)
    .map((value) => parseInt(value.trim()))
    .filter((id) => !isNaN(id))
  dropIds.sort((a, b) => a - b)
  return dropIds
}

export function joinDropIds(dropIds: number[]): string {
  return parseDropIds(dropIds.join(',')).join(',')
}

export const DEFAULT_SEARCH_LIMIT = 10

export const DEFAULT_DROP_LIMIT = 100

export const DROPS_LIMIT = 20

export const SEARCH_LIMIT = 10
