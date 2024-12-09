import { IGNORED_OWNERS } from 'models/address'
import { DEFAULT_COLLECTOR_LIMIT, parseColectorDrop, parseCollector } from 'models/collector'
import { DEFAULT_DROP_LIMIT } from 'models/event'
import { DEFAULT_COMPASS_LIMIT } from 'models/compass'
import { DEFAULT_POAP_LIMIT, parsePOAP, POAP } from 'models/poap'
import { Drop } from 'models/drop'
import { queryAllCompass } from 'loaders/compass'

export async function fetchDropCollectors(
  dropIds: number[],
  abortSignal?: AbortSignal,
  limit = Math.min(DEFAULT_COLLECTOR_LIMIT, DEFAULT_COMPASS_LIMIT),
): Promise<string[]> {
  return await queryAllCompass(
    `poaps`,
    parseCollector,
    `
      query FetchDropCollectors(
        $dropIds: [bigint!]
        $offset: Int!
        $limit: Int!
      ) {
        poaps(
          where: {
            drop_id: { _in: $dropIds }
            collector_address: {
              _nin: ["${IGNORED_OWNERS.join('", "')}"]
            }
          }
          distinct_on: collector_address
          offset: $offset
          limit: $limit
        ) {
          collector_address
        }
      }
    `,
    {
      dropIds,
      limit,
    },
    'offset',
    limit,
    abortSignal
  )
}

export async function fetchCollectorDrops(
  address: string,
  abortSignal?: AbortSignal,
  limit = Math.min(DEFAULT_DROP_LIMIT, DEFAULT_COMPASS_LIMIT),
): Promise<Drop[]> {
  return await queryAllCompass(
    `poaps`,
    (data: unknown) => parseColectorDrop(data, /*includeDescription*/false),
    `
      query FetchCollectorDrops(
        $address: String!
        $offset: Int!
        $limit: Int!
      ) {
        poaps(
          where: {
            collector_address: { _eq: $address }
          }
          distinct_on: drop_id
          offset: $offset
          limit: $limit
        ) {
          drop {
            id
            name
            description
            image_url
            city
            country
            start_date
            end_date
            expiry_date
            drop_image {
              gateways {
                type
                url
              }
            }
          }
        }
      }

    `,
    {
      address: address.toLowerCase(),
      limit,
    },
    'offset',
    limit,
    abortSignal,
  )
}

export async function fetchCollectorPOAPs(
  address: string,
  abortSignal?: AbortSignal,
  limit = Math.min(DEFAULT_POAP_LIMIT, DEFAULT_COMPASS_LIMIT),
): Promise<POAP[]> {
  return await queryAllCompass(
    'poaps',
    parsePOAP,
    `
      query FetchCollectorPOAPs(
        $address: String!
        $offset: Int!
        $limit: Int!
      ) {
        poaps(
          where: {
            collector_address: { _eq: $address }
          }
          offset: $offset
          limit: $limit
        ) {
          id
          collector_address
          minted_on
          drop {
            id
            name
            description
            image_url
            city
            country
            start_date
            end_date
            expiry_date
            drop_image {
              gateways {
                type
                url
              }
            }
          }
        }
      }
    `,
    {
      address: address.toLowerCase(),
      limit,
    },
    'offset',
    limit,
    abortSignal
  )
}
