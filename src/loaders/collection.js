import { Collection, CollectionWithDrops } from '../models/collection'
import { DEFAULT_COMPASS_LIMIT } from '../models/compass'
import { queryAggregateCountCompass, queryAllCompass, queryManyCompass } from './compass'

/**
 * Retrieve collections that has all given drops and collections that only have
 * some of the given drops (related) when more than one is given.
 *
 * @param {number[]} eventIds
 * @param {number} limit
 * @returns {{
 *   collections: ReturnType<Collection>[]
 *   related: ReturnType<Collection>[]
 * }}
 */
export async function findEventsCollections(
  eventIds,
  limit = DEFAULT_COMPASS_LIMIT,
) {
  const [collections, related] = await Promise.all([
    queryAllCompass(
      'collections',
      Collection,
      `
        query EventsCollections(
          $offset: Int!
          $limit: Int!
        ) {
          collections(
            where: {
              _and: [
                ${eventIds.map((eventId) => `
                  {
                    collections_items: {
                      drop_id: {
                        _eq: ${eventId}
                      }
                    }
                  }
                `)}
              ]
            }
            offset: $offset
            limit: $limit
          ) {
            id
            slug
            title
            banner_image_url
            logo_image_url
          }
        }
      `,
      {
        limit,
      },
      'offset',
      limit
    ),
    eventIds.length < 2 ? Promise.resolve([]) : queryAllCompass(
      'collections',
      Collection,
      `
        query EventsRelatedCollections(
          $eventIds: [bigint!]
          $offset: Int!
          $limit: Int!
        ) {
          collections(
            where: {
              collections_items: {
                drop_id: {
                  _in: $eventIds
                }
              }
            }
            offset: $offset
            limit: $limit
          ) {
            id
            slug
            title
            banner_image_url
            logo_image_url
          }
        }
      `,
      {
        eventIds,
        limit,
      },
      'offset',
      limit
    )
  ])

  const collectionsIds = collections.map((collection) => collection.id)

  return {
    collections,
    related: related.filter(
      (collection) => !collectionsIds.includes(collection.id)
    ),
  }
}

/**
 * Retrieve collections that includes given drops.
 *
 * @param {number[]} eventIds
 * @param {number} limit
 * @returns {ReturnType<Collection>[]}
 */
export async function findEventsInCollections(
  eventIds,
  limit = DEFAULT_COMPASS_LIMIT,
) {
  const results = await queryAllCompass(
    'collections',
    Collection,
    `
      query EventsInCollections(
        $eventIds: [bigint!]
        $offset: Int!
        $limit: Int!
      ) {
        collections(
          where: {
            collections_items: {
              drop_id: {
                _in: $eventIds
              }
            }
          }
          offset: $offset
          limit: $limit
        ) {
          id
          slug
          title
          banner_image_url
          logo_image_url
        }
      }
    `,
    {
      eventIds,
      limit,
    },
    'offset',
    limit
  )

  return results.collections
}

/**
 * Search collections by name.
 *
 * @param {string} search
 * @param {number} offset
 * @param {number} limit
 * @param {AbortSignal | undefined | null} abortSignal
 * @returns {{
 *   total: number | null
 *   items: ReturnType<CollectionWithDrops>[]
 * }}
 */
export async function searchCollections(
  search,
  offset = 0,
  limit = DEFAULT_COMPASS_LIMIT,
  abortSignal,
) {
  const [totalSettled, itemsSettled] = await Promise.allSettled([
    queryAggregateCountCompass(
      'search_collections_aggregate',
      `
        query SearchCollectionsTotal($search: String!) {
          search_collections_aggregate(
            args: {
              search: $search
            }
          ) {
            aggregate {
              count
            }
          }
        }
      `,
      {
        search,
      },
      abortSignal
    ),
    queryManyCompass(
      'search_collections',
      CollectionWithDrops,
      `
        query SearchCollections($search: String!, $offset: Int!, $limit: Int!) {
          search_collections(
            args: {
              search: $search
            }
            offset: $offset
            limit: $limit
          ) {
            id
            title
            slug
            banner_image_url
            logo_image_url
            collections_items {
              drop_id
            }
          }
        }
      `,
      {
        search,
        offset,
        limit,
      },
      abortSignal
    ),
  ])

  if (itemsSettled.status === 'rejected') {
    throw itemsSettled.reason instanceof Error
      ? itemsSettled.reason
      : new Error(itemsSettled.reason)
  }

  const total = totalSettled.status === 'fulfilled' ? totalSettled.value : null
  const items = itemsSettled.value

  return {
    total,
    items,
  }
}
