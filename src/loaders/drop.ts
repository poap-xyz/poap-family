import { DEFAULT_COMPASS_LIMIT } from 'models/compass'
import { DEFAULT_SEARCH_LIMIT } from 'models/event'
import { Drop, parseDrop } from 'models/drop'
import { queryAggregateCountCompass, queryManyCompass } from 'loaders/compass'

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
