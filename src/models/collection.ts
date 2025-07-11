import { getRandomInt } from 'utils/number'

export const COLLECTIONS_LIMIT = 7

export interface Collection {
  id: number
  slug: string
  title: string | null
  banner_image_url: string | null
  logo_image_url: string | null
}

export function parseCollection(collection: unknown): Collection {
  if (
    typeof collection !== 'object' ||
    !('id' in collection) ||
    typeof collection.id !== 'number' ||
    !('slug' in collection) ||
    typeof collection.slug !== 'string'
  ) {
    throw new Error('Invalid collection')
  }
  return {
    id: collection.id,
    slug: collection.slug,
    title: (
      'title' in collection &&
      collection.title != null &&
      typeof collection.title === 'string'
        ? collection.title
        : null
    ),
    banner_image_url: (
      'banner_image_url' in collection &&
      collection.banner_image_url != null &&
      typeof collection.banner_image_url === 'string'
        ? collection.banner_image_url
        : null
    ),
    logo_image_url: (
      'logo_image_url' in collection &&
      collection.logo_image_url != null &&
      typeof collection.logo_image_url === 'string'
        ? collection.logo_image_url
        : null
    ),
  }
}

export interface CollectionWithDrops {
  id: number
  slug: string
  title: string | null
  banner_image_url: string | null
  logo_image_url: string | null
  dropIds: number[]
}

export function parseCollectionWithDrops(collectionWithDrops: unknown): CollectionWithDrops {
  const collection = parseCollection(collectionWithDrops)

  if (
    collectionWithDrops == null ||
    typeof collectionWithDrops !== 'object' ||
    !('collections_items' in collectionWithDrops) ||
    collectionWithDrops.collections_items == null ||
    !Array.isArray(collectionWithDrops.collections_items) ||
    !collectionWithDrops.collections_items.every(
      (collectionItem): collectionItem is { drop_id: number } =>
        typeof collectionItem === 'object' &&
        'drop_id' in collectionItem &&
        typeof collectionItem.drop_id === 'number'
    )
  ) {
    throw new Error(`Collection ${collection.id} with invalid drops`)
  }

  return {
    id: collection.id,
    slug: collection.slug,
    title: collection.title,
    banner_image_url: collection.banner_image_url,
    logo_image_url: collection.logo_image_url,
    dropIds: collectionWithDrops.collections_items.map(
      (collectionItem) => collectionItem.drop_id
    ),
  }
}

export function resizeCollectionImageUrl(
  imageUrl: string,
  size: string | number | { w: number; h: number },
): string {
  let poapSize = 'medium'

  if (
    size === 'xsmall' ||
    size === 'small' ||
    size === 'medium' ||
    size === 'large' ||
    size === 'xlarge'
  ) {
    poapSize = size
  } else if (
    typeof size === 'object' &&
    'w' in size &&
    typeof size.w === 'number'
  ) {
    if (size.w <= 64) {
      poapSize = 'xsmall'
    } else if (size.w <= 128) {
      poapSize = 'small'
    } else if (size.w <= 256) {
      poapSize = 'medium'
    } else if (size.w <= 512) {
      poapSize = 'large'
    } else {
      poapSize = 'xlarge'
    }
  } else if (typeof size === 'number') {
    if (size <= 64) {
      poapSize = 'xsmall'
    } else if (size <= 128) {
      poapSize = 'small'
    } else if (size <= 256) {
      poapSize = 'medium'
    } else if (size <= 512) {
      poapSize = 'large'
    } else {
      poapSize = 'xlarge'
    }
  }

  return `${imageUrl}?size=${poapSize}`
}
