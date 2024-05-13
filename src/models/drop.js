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
 return {
   id: event.id,
   name: event.name,
   description: includeDescription ? event.description : undefined,
   image_url: event.image_url,
   original_url: event.original_url
     ?? event.drop_image?.gateways?.reduce(
       (original, gateway) => gateway.type === 'ORIGINAL' ? gateway.url : original,
       event.image_url
     )
     ?? event.image_url,
   city: event.city,
   country: event.country,
   start_date: event.start_date,
   end_date: event.end_date,
   expiry_date: event.expiry_date,
 }
}

/**
* @param {unknown} eventOwners
* @returns {{
*   owners: string[]
*   ts: number
* }}
*/
export function DropOwners(eventOwners) {
 if (eventOwners == null) {
   return null
 }
 if (
   typeof eventOwners !== 'object' ||
   !('owners' in eventOwners) ||
   !Array.isArray(eventOwners.owners) ||
   !('ts' in eventOwners) ||
   eventOwners.ts == null ||
   typeof eventOwners.ts !== 'number'
 ) {
   throw new Error('Malformed event owners')
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
* }}
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
   throw new Error('Malformed event metrics')
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
