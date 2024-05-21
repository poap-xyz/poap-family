import PropTypes from 'prop-types'

/**
 * @param {unknown} event
 * @param {boolean} includeDescription
 * @returns {{
*   id: number
*   name: string
*   description?: string
*   image_url: string
*   original_url: string
*   city: string | null
*   country: string | null
*   start_date: string
*   end_date: string
*   expiry_date: string
* }}
*/
export function Drop(event, includeDescription) {
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

export const DropProps = {
  id: PropTypes.number.isRequired,
  name: PropTypes.string.isRequired,
  description: PropTypes.string,
  image_url: PropTypes.string.isRequired,
  original_url: PropTypes.string.isRequired,
  city: PropTypes.string,
  country: PropTypes.string,
  start_date: PropTypes.string.isRequired,
  end_date: PropTypes.string.isRequired,
  expiry_date: PropTypes.string.isRequired,
}

/**
* @param {unknown} eventOwners
* @returns {{
*   owners: string[]
*   ts: number
* }}
*/
export function DropOwners(eventOwners) {
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

/**
* @param {unknown} eventMetrics
* @returns {{
*   emailReservations: number
*   emailClaimsMinted: number
*   emailClaims: number
*   momentsUploaded: number
*   collectionsIncludes: number
*   ts: number
* } | null}
*/
export function DropMetrics(eventMetrics) {
  if (eventMetrics == null) {
    return null
  }
  if (
    typeof eventMetrics !== 'object' ||
    !('emailReservations' in eventMetrics) ||
    typeof eventMetrics.emailReservations !== 'number' ||
    !('emailClaimsMinted' in eventMetrics) ||
    typeof eventMetrics.emailClaimsMinted !== 'number' ||
    !('emailClaims' in eventMetrics) ||
    typeof eventMetrics.emailClaims !== 'number' ||
    !('momentsUploaded' in eventMetrics) ||
    typeof eventMetrics.momentsUploaded !== 'number' ||
    !('collectionsIncludes' in eventMetrics) ||
    typeof eventMetrics.collectionsIncludes !== 'number' ||
    !('ts' in eventMetrics) ||
    typeof eventMetrics.ts !== 'number'
  ) {
    throw new Error('Malformed drop metrics')
  }
  return {
    emailReservations: eventMetrics.emailReservations,
    emailClaimsMinted: eventMetrics.emailClaimsMinted,
    emailClaims: eventMetrics.emailClaims,
    momentsUploaded: eventMetrics.momentsUploaded,
    collectionsIncludes: eventMetrics.collectionsIncludes,
    ts: eventMetrics.ts,
  }
}

/**
 * @param {unknown} data
 * @param {boolean} [includeDescription]
 * @param {boolean} [includeMetrics]
 * @returns {{
 *   event: ReturnType<typeof Drop>
 *   owners: string[]
 *   ts: number | null
 *   metrics: ReturnType<typeof DropMetrics> | null
 * }}
 */
export function DropData(
  data,
  includeDescription = false,
  includeMetrics = true,
) {
  if (
    data == null ||
    typeof data !== 'object' ||
    !('event' in data) ||
    !('owners' in data) ||
    !('ts' in data)
  ) {
    throw new Error('Malformed drop data')
  }
  /**
   * @type {{
   *   owners: string[]
   *   ts: number | null
   * }}
   */
  let dropOwners
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
    dropOwners = DropOwners({
      owners: data.owners,
      ts: data.ts,
    })
  }
  if (!includeMetrics) {
    return {
      event: Drop(data.event, includeDescription),
      owners: dropOwners.owners,
      ts: dropOwners.ts,
      metrics: null,
    }
  }
  if (!('metrics' in data)) {
    throw new Error('Malformed drop data')
  }
  return {
    event: Drop(data.event, includeDescription),
    owners: dropOwners.owners,
    ts: dropOwners.ts,
    metrics: DropMetrics(data.metrics),
  }
}

/**
 * @param {unknown} drops
 * @param {boolean} [includeDescription]
 * @returns {Record<number, ReturnType<typeof Drop>>}
 */
export function Drops(drops, includeDescription = false) {
  if (drops == null || typeof drops !== 'object') {
    throw new Error('Invalid drops')
  }

  return Object.fromEntries(
    Object.entries(drops).map(
      ([eventId, event]) => [eventId, Drop(event, includeDescription)]
    )
  )
}
