import { Collections } from '../models/collection'
import { DEFAULT_COMPASS_LIMIT } from '../models/compass'
import { queryCompass } from './compass'

async function findEventsCollections(eventIds, limit = DEFAULT_COMPASS_LIMIT) {
  const results = await queryCompass(
    'find events collections',
    {
      collections: Collections,
      includes: eventIds.length > 1 ? Collections : undefined,
    },
    `
      query FindEventsCollections(
        $collections: Int!
        ${eventIds.length > 1 ? '$includes: Int!' : ''}
      ) {
        collections(
          where: {
            _and: [
              ${eventIds.map((eventId) => `
                { collections_items: { drop_id: { _eq: ${eventId} } } }
              `)}
            ]
          }
          offset: $collections
          limit: ${limit}
        ) {
          id
          slug
          title
          banner_image_url
          logo_image_url
        }
        ${eventIds.length < 2 ? '' : `
          includes: collections(
            where: {
              collections_items: { drop_id: { _in: [${eventIds.join(', ')}] } }
            }
            offset: $includes
            limit: ${limit}
          ) {
            id
            slug
            title
            banner_image_url
            logo_image_url
          }
        `}
      }
    `,
    {},
    {
      collections: limit,
      includes: eventIds.length > 1 ? limit : undefined,
    }
  )
  const collections = results.collections
  const collectionsIds = collections.map((collection) => collection.id)
  const includes = !results.includes ? []
    : results.includes.filter(
      (collection) => !collectionsIds.includes(collection.id)
    )
  return { collections, includes }
}

async function findEventsInCollections(eventIds, limit = DEFAULT_COMPASS_LIMIT) {
  const results = await queryCompass(
    'find related collections',
    {
      collections: Collections,
    },
    `
      query FindEventsInCollections($collections: Int!) {
        collections(
          where: {
            collections_items: { drop_id: { _in: [${eventIds.join(', ')}] } }
          }
          offset: $collections
          limit: ${limit}
        ) {
          id
          slug
          title
          banner_image_url
          logo_image_url
        }
      }
    `,
    {},
    {
      collections: limit,
    }
  )
  return results.collections
}

export {
  findEventsCollections,
  findEventsInCollections,
}
