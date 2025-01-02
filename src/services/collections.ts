import {
  Collection,
  COLLECTIONS_LIMIT,
  CollectionWithDrops,
  parseCollection,
  parseCollectionWithDrops,
} from 'models/collection'
import { DEFAULT_COMPASS_LIMIT } from 'models/compass'
import {
  queryAggregateCountCompass,
  queryAllCompass,
  queryManyCompass,
} from 'services/compass'

/**
 * Retrieve collections that has all given drops and collections that only have
 * some of the given drops (related) when more than one is given.
 */
export async function fetchDropsCollections(
  dropIds: number[],
  abortSignal: AbortSignal,
  limit: number = Math.min(COLLECTIONS_LIMIT, DEFAULT_COMPASS_LIMIT),
): Promise<{
  collections: Collection[]
  related: Collection[]
}> {
  const [collections, related] = await Promise.all([
    queryAllCompass(
      'collections',
      parseCollection,
      `
        query DropsCollections(
          $offset: Int!
          $limit: Int!
        ) {
          collections(
            where: {
              _and: [
                ${dropIds.map((dropId) => `
                  {
                    collections_items: {
                      drop_id: {
                        _eq: ${dropId}
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
      limit,
      abortSignal
    ),
    dropIds.length < 2 ? Promise.resolve([]) : queryAllCompass(
      'collections',
      parseCollection,
      `
        query DropsRelatedCollections(
          $dropIds: [bigint!]
          $offset: Int!
          $limit: Int!
        ) {
          collections(
            where: {
              collections_items: {
                drop_id: {
                  _in: $dropIds
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
        dropIds,
        limit,
      },
      'offset',
      limit,
      abortSignal
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
 * Search collections by name.
 */
export async function searchCollections(
  search: string,
  abortSignal: AbortSignal,
  offset: number = 0,
  limit: number = Math.min(COLLECTIONS_LIMIT, DEFAULT_COMPASS_LIMIT),
): Promise<{
  total: number | null
  items: CollectionWithDrops[]
}> {
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
      parseCollectionWithDrops,
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
