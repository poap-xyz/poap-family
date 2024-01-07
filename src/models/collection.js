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
    if (size === 'small') {
      w = 128
      h = 128
    } else if  (size === 'medium') {
      w = 256
      h = 256
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
    let poapSize = 'small'

    if (size === 'small' || size === 'medium') {
      poapSize = size
    } else if (
      typeof size === 'object' &&
      'w' in size && typeof size.w === 'number' &&
      'h' in size && typeof size.h === 'number' &&
      size.w === size.h
    ) {
      if (size.w <= 128) {
        poapSize = 'small'
      } else if (size.w >= 256) {
        poapSize = 'medium'
      }
    }

    return `${imageUrl}?size=${poapSize}`
  }

  return imageUrl
}

export {
  Collection,
  Collections,
  COLLECTIONS_LIMIT,
  resizeCollectionImageUrl,
}
