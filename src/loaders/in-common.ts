import { queryAllCompass } from 'loaders/compass'
import { DEFAULT_COMPASS_LIMIT } from 'models/compass'
import { normalizeAddress } from 'utils/ethereum'
import { uniq } from 'utils/array'

export function parsePoapOwner(token: unknown): string {
  if (
    token == null ||
    typeof token !== 'object'
  ) {
    throw new Error('Invalid POAP')
  }
  if (
    !('collector_address' in token) ||
    token.collector_address == null ||
    typeof token.collector_address !== 'string'
  ) {
    throw new Error('Invalid POAP owner')
  }
  const normalized = normalizeAddress(token.collector_address)
  if (normalized == null) {
    throw new Error('Invalid POAP owner address')
  }
  return normalized
}

export async function findEventsInCommonAddresses(
  leftEventId: number,
  rightEventId: number,
  abortSignal: AbortSignal,
  limit: number = DEFAULT_COMPASS_LIMIT,
): Promise<string[]> {
  const addresses = await queryAllCompass(
    'poaps',
    parsePoapOwner,
    `
      query EventsInCommonAddresses(
        $leftEventId: Int!
        $rightEventId: Int!
        $offset: Int!
        $limit: Int!
      ) {
        poaps(
          where: {
            drop_id: { _eq: $leftEventId },
            collector_stats_by_chain: {
              poaps: {
                drop: {
                  stats_by_chain: {
                    drop_id: { _eq: $rightEventId }
                  }
                }
              }
            }
          }
          offset: $offset
          limit: $limit
        ) {
          collector_address
        }
      }
    `,
    {
      leftEventId,
      rightEventId,
      limit,
    },
    'offset',
    limit,
    undefined,
    abortSignal
  )
  return uniq(addresses)
}

function parseEventInCommonIdCount(event: unknown): [number, number] {
  if (
    event == null ||
    typeof event !== 'object'
  ) {
    throw new Error('Invalid Drop')
  }
  if (
    !('id' in event) ||
    event.id == null ||
    typeof event.id !== 'number'
  ) {
    throw new Error('Invalid Drop ID')
  }
  if (
    !('poaps_aggregate' in event) ||
    event.poaps_aggregate == null ||
    typeof event.poaps_aggregate !== 'object' ||
    !('aggregate' in event.poaps_aggregate) ||
    event.poaps_aggregate.aggregate == null ||
    typeof event.poaps_aggregate.aggregate !== 'object' ||
    !('count' in event.poaps_aggregate.aggregate) ||
    event.poaps_aggregate.aggregate.count == null ||
    typeof event.poaps_aggregate.aggregate.count !== 'number'
  ) {
    throw new Error('Invalid Drop in common count')
  }
  return [event.id, event.poaps_aggregate.aggregate.count]
}

export async function findEventsInCommonCount(
  eventId: number,
  abortSignal: AbortSignal,
  limit: number = DEFAULT_COMPASS_LIMIT,
): Promise<Record<number, number>> {
  const events = await queryAllCompass(
    'drops',
    parseEventInCommonIdCount,
    `
      query EventsInCommonCount(
        $eventId: Int!
        $offset: Int!
        $limit: Int!
      ) {
        drops(
          where: {
            poaps: {
              collector_stats_by_chain: {
                poaps: {
                  drop_id: { _eq: $eventId }
                }
              }
            }
            poaps_aggregate: {
              count: {
                filter: {
                  collector_stats_by_chain: {
                    poaps: {
                      drop_id: { _eq: $eventId }
                    }
                  }
                }
                predicate: { _gt: 1 }
              }
            }
          }
          offset: $offset
          limit: $limit
        ) {
          id
          poaps_aggregate(
            where: {
              collector_stats_by_chain: {
                poaps: {
                  drop_id: { _eq: $eventId }
                }
              }
            }
          ) {
            aggregate {
              count
            }
          }
        }
      }
    `,
    {
      eventId,
      limit,
    },
    'offset',
    limit,
    undefined,
    abortSignal
  )
  return { ...new Map(events) }
}
