function Collection(collection) {
  if (
    typeof collection !== 'object' ||
    !('id' in collection) || typeof collection.id !== 'number' ||
    !('slug' in collection) || typeof collection.slug !== 'string'
  ) {
    throw new Error('Invalid collection')
  }
  return {
    id: collection.id,
    slug: collection.slug,
    title: collection.title ?? null,
    banner_image_url: collection.banner_image_url ?? null,
    logo_image_url: collection.logo_image_url ?? null,
  }
}

function Collections(collections) {
  if (!Array.isArray(collections)) {
    throw new Error('Invalid collections')
  }
  return collections.map((collection) => Collection(collection))
}

function CollectionWithDrops(collectionWithDrops) {
  const collection = Collection(collectionWithDrops)

  if (
    !('collections_items' in collectionWithDrops) &&
    !Array.isArray(collectionWithDrops.collections_items) &&
    !collectionWithDrops.collections_items.every((collectionItem) =>
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

function CollectionsWithDrops(collections) {
  if (!Array.isArray(collections)) {
    throw new Error('Invalid collections')
  }
  return collections.map((collection) => CollectionWithDrops(collection))
}

function CollectionsCount(data) {
  if (
    !data ||
    typeof data !== 'object' ||
    !('aggregate' in data) ||
    !data.aggregate ||
    typeof data.aggregate !== 'object' ||
    !('count' in data.aggregate) ||
    typeof data.aggregate.count !== 'number'
  ) {
    throw new Error('Invalid collection count')
  }
  return data.aggregate.count
}

const COLLECTIONS_LIMIT = 7

function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min) + min); // The maximum is exclusive and the minimum is inclusive
}

function resizeCollectionImageUrl(imageUrl, size) {
  if (imageUrl.indexOf('collections-media-production') >= 0) {
    const url = new URL(imageUrl)
    url.host = `poap${Math.trunc(getRandomInt(0, 4))}-collections.imgix.net`

    let w, h
    if (size === 'xsmall') {
      w = 64
      h = 64
    } else if (size === 'small') {
      w = 128
      h = 128
    } else if  (size === 'medium') {
      w = 256
      h = 256
    } else if  (size === 'large') {
      w = 512
      h = 512
    } else if  (size === 'xlarge') {
      w = 1024
      h = 1024
    } else if (
      typeof size === 'object' &&
      'w' in size && typeof size.w === 'number' &&
      'h' in size && typeof size.h === 'number'
    ) {
      w = size.w
      h = size.h
    }

    if (w && h) {
      return url.toString() + `?w=${w}&h=${h}&fit=crop`
    }
  } else if (imageUrl.indexOf('assets.poap.xyz') >= 0) {
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
    }

    return `${imageUrl}?size=${poapSize}`
  }

  return imageUrl
}

export {
  Collection,
  Collections,
  CollectionWithDrops,
  CollectionsWithDrops,
  CollectionsCount,
  COLLECTIONS_LIMIT,
  resizeCollectionImageUrl,
}
