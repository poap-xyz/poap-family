import { IGNORED_OWNERS } from 'models/address'
import { DEFAULT_COLLECTOR_LIMIT, parseCollector } from 'models/collector'
import { DEFAULT_COMPASS_LIMIT } from 'models/compass'
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
      query FetchCollectors(
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
