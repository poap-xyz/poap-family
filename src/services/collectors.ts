import { IGNORED_ADDRESSES, isAddress } from 'models/address'
import { DEFAULT_COLLECTOR_LIMIT, parseColectorDrop, parseCollectorAddress } from 'models/collector'
import { DEFAULT_COMPASS_LIMIT } from 'models/compass'
import { DEFAULT_POAP_LIMIT, parsePOAP, POAP } from 'models/poap'
import { DEFAULT_DROP_LIMIT, Drop } from 'models/drop'
import { queryAllCompass } from 'services/compass'

export async function fetchCollectorsByDrops(
  dropIds: number[],
  abortSignal?: AbortSignal,
  dropsLimit: number = Math.min(DEFAULT_DROP_LIMIT, DEFAULT_COMPASS_LIMIT),
  collectorsLimit: number = Math.min(DEFAULT_COLLECTOR_LIMIT, DEFAULT_COMPASS_LIMIT),
): Promise<Record<number, string[]>> {
  const collectorsByDrops: Record<number, Set<string>> = {}

  for (let i = 0; i < dropIds.length; i += dropsLimit) {
    const ids = dropIds.slice(i, i + dropsLimit)

    if (ids.length === 0) {
      break
    }

    const dropsCollectors = await queryAllCompass(
      'poaps',
      (data: unknown): { dropId: number; address: string } => {
        if (
          data == null ||
          typeof data !== 'object' ||
          !('drop_id' in data) ||
          data.drop_id == null ||
          typeof data.drop_id !== 'number' ||
          !('collector_address' in data) ||
          !isAddress(data.collector_address)
        ) {
          throw new Error('Malformed drop collector')
        }
        return {
          dropId: data.drop_id,
          address: data.collector_address,
        }
      },
      `
        query FetchCollectorsByDrops(
          $offset: Int!
          $limit: Int!
          $dropIds: [bigint!]
        ) {
          poaps(
            where: {
              drop_id: { _in: $dropIds }
              collector_address: {
                _nin: ["${IGNORED_ADDRESSES.join('", "')}"]
              }
            }
            offset: $offset
            limit: $limit
          ) {
            collector_address
            drop_id
          }
        }
      `,
      {
        dropIds: ids,
        limit: collectorsLimit,
      },
      'offset',
      collectorsLimit,
      abortSignal
    )

    for (const dropCollector of dropsCollectors) {
      if (!(dropCollector.dropId in collectorsByDrops)) {
        collectorsByDrops[dropCollector.dropId] = new Set<string>()
      }
      collectorsByDrops[dropCollector.dropId].add(dropCollector.address)
    }
  }

  return Object.fromEntries(
    Object.entries(collectorsByDrops).map(
      ([rawDropId, collectorsSet]) => [rawDropId, [...collectorsSet]]
    )
  )
}

export async function fetchDropsCollectors(
  dropIds: number[],
  abortSignal?: AbortSignal,
  limit = Math.min(DEFAULT_COLLECTOR_LIMIT, DEFAULT_COMPASS_LIMIT),
): Promise<string[]> {
  return await queryAllCompass(
    `poaps`,
    parseCollectorAddress,
    `
      query FetchDropsCollectors(
        $dropIds: [bigint!]
        $offset: Int!
        $limit: Int!
      ) {
        poaps(
          where: {
            drop_id: { _in: $dropIds }
            collector_address: {
              _nin: ["${IGNORED_ADDRESSES.join('", "')}"]
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
