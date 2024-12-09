import { DEFAULT_COMPASS_LIMIT } from 'models/compass'
import { DEFAULT_DROP_LIMIT, DEFAULT_SEARCH_LIMIT } from 'models/event'
import { Drop, parseDrop } from 'models/drop'
import { queryAggregateCountCompass, queryFirstCompass, queryManyCompass } from 'loaders/compass'
import { HttpError } from 'models/error'

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
  limit: number = Math.min(DEFAULT_DROP_LIMIT, DEFAULT_COMPASS_LIMIT),
): Promise<[
  Record<number, Drop>,
  Record<number, Error>
]> {
  const eventsMap: Record<number, Drop> = {}
  const errorsMap: Record<number, Error> = {}

  for (let i = 0; i < dropIds.length; i += limit) {
    const ids = dropIds.slice(i, i + limit)

    if (ids.length === 0) {
      break
    }

    try {
      const drops = await queryManyCompass(
        'drops',
        (data: unknown): Drop => parseDrop(data, /*includeDescription*/false),
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
      )

      for (const id of ids) {
        const drop = drops.find((drop) => drop.id === id)

        if (!drop) {
          errorsMap[id] = new HttpError(`Drop '${id}' not found`, {
            status: 404,
          })
        } else {
          eventsMap[id] = drop
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

  return [eventsMap, errorsMap]
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
