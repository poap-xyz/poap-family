import { DEFAULT_COMPASS_LIMIT } from 'models/compass'
import {
  Drop,
  DropMetrics,
  parseDrop,
  parseDropMetrics,
  DEFAULT_SEARCH_LIMIT,
  DEFAULT_DROP_LIMIT,
} from 'models/drop'
import { HttpError } from 'models/error'
import {
  queryAggregateCountCompass,
  queryCompass,
  queryFirstCompass,
  queryManyCompass,
} from 'services/compass'

export async function searchDrops(
  query: string,
  abortSignal: AbortSignal,
  offset: number = 0,
  limit: number = Math.min(DEFAULT_SEARCH_LIMIT, DEFAULT_COMPASS_LIMIT),
): Promise<{
  items: Drop[]
  total: number
  offset: number
  limit: number
}> {
  const [items, total] = await Promise.all([
    queryManyCompass(
      'search_drops',
      (data: unknown) => parseDrop(data, /*includeDescription*/true),
      `
        query SearchDrops(
          $limit: Int!
          $offset: Int!
          $query: String!
        ) {
          search_drops(
            limit: $limit
            offset: $offset
            args: {
              search: $query
            }
          ) {
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
      `,
      {
        query,
        offset,
        limit,
      },
      abortSignal
    ),
    queryAggregateCountCompass(
      'search_drops_aggregate',
      `
        query SearchDropsCount($query: String!) {
          search_drops_aggregate(args: { search: $query }) {
            aggregate {
              count
            }
          }
        }
      `,
      {
        query,
      },
      abortSignal
    ),
  ])
  return {
    items,
    total,
    offset,
    limit,
  }
}

export async function fetchDropsOrErrors(
  dropIds: number[],
  includeDescription: boolean = false,
  abortSignal?: AbortSignal,
  limit: number = Math.min(DEFAULT_DROP_LIMIT, DEFAULT_COMPASS_LIMIT),
): Promise<[
  Record<number, Drop>,
  Record<number, Error>
]> {
  const dropsMap: Record<number, Drop> = {}
  const errorsMap: Record<number, Error> = {}

  for (let i = 0; i < dropIds.length; i += limit) {
    const ids = dropIds.slice(i, i + limit)

    if (ids.length === 0) {
      break
    }

    try {
      const drops = await queryManyCompass(
        'drops',
        (data: unknown): Drop => parseDrop(data, includeDescription),
        `
          query FetchDrops($dropIds: [Int!]) {
            drops(where: { id: { _in: $dropIds } }) {
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
        `,
        {
          dropIds: ids,
        },
        abortSignal
      )

      for (const id of ids) {
        const drop = drops.find((drop) => drop.id === id)

        if (!drop) {
          errorsMap[id] = new HttpError(`Drop '${id}' not found`, {
            status: 404,
          })
        } else {
          dropsMap[id] = drop
        }
      }
    } catch (err: unknown) {
      for (const id of ids) {
        errorsMap[id] = err instanceof Error
          ? err
          : new Error(`Failed to fetch drop '${id}'`, { cause: err })
      }
    }
  }

  return [dropsMap, errorsMap]
}

export async function fetchDrop(
  dropId: number,
  includeDescription: boolean,
  abortSignal?: AbortSignal,
): Promise<Drop | null> {
  try {
    return await queryFirstCompass(
      `drops`,
      (data: unknown): Drop => parseDrop(data, includeDescription),
      `
        query FetchDrop($dropId: Int!) {
          drops(limit: 1, where: { id: { _eq: $dropId } }) {
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
      `,
      {
        dropId,
      },
      undefined,
      abortSignal,
    )
  } catch (err: unknown) {
    if (err instanceof HttpError && err.status === 404) {
      return null
    }

    throw err
  }
}

export async function fetchDropMetrics(
  dropId: number,
  abortSignal?: AbortSignal,
): Promise<DropMetrics | null> {
  return await queryCompass(
    'drops_by_pk',
    parseDropMetrics,
    `
      query DropMetrics($dropId: Int!) {
        drops_by_pk(id: $dropId) {
          poaps_aggregate {
            aggregate {
              count
            }
          }
          email_claims_stats {
            minted
            reserved
            total
          }
          moments_stats {
            moments_uploaded
          }
          collections_items_aggregate {
            aggregate {
              count(columns: collection_id, distinct: true)
            }
          }
        }
      }
    `,
    {
      dropId,
    },
    abortSignal,
  )
}

export async function fetchDropsMetrics(
  dropIds: number[],
  abortSignal?: AbortSignal,
  limit: number = Math.min(DEFAULT_DROP_LIMIT, DEFAULT_COMPASS_LIMIT),
): Promise<Record<number, DropMetrics>> {
  const dropsMetrics: Record<number, DropMetrics> = {}

  for (let i = 0; i < dropIds.length; i += limit) {
    const ids = dropIds.slice(i, i + limit)

    if (ids.length === 0) {
      break
    }

    const drops = await queryManyCompass(
      'drops',
      (data: unknown): DropMetrics & { id: number } => {
        if (
          data == null ||
          typeof data !== 'object' ||
          !('id' in data) ||
          data.id == null ||
          typeof data.id !== 'number'
        ) {
          throw new Error('Invalid drop id')
        }

        return {
          ...parseDropMetrics(data),
          id: data.id,
        }
      },
      `
        query DropsMetrics($dropIds: [Int!]) {
          drops(
            where: {
              id: { _in: $dropIds }
            }
          ) {
            poaps_aggregate {
              aggregate {
                count
              }
            }
            email_claims_stats {
              minted
              reserved
              total
            }
            moments_stats {
              moments_uploaded
            }
            collections_items_aggregate {
              aggregate {
                count(columns: collection_id, distinct: true)
              }
            }
            id
          }
        }
      `,
      {
        dropIds: ids,
      },
      abortSignal,
    )

    for (const drop of drops) {
      dropsMetrics[drop.id] = {
        mints: drop.mints,
        emailReservations: drop.emailReservations,
        emailClaimsMinted: drop.emailClaimsMinted,
        emailClaims: drop.emailClaims,
        momentsUploaded: drop.momentsUploaded,
        collectionsIncludes: drop.collectionsIncludes,
      }
    }
  }

  return dropsMetrics
}
