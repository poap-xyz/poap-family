import { Drop, parseDrop } from 'models/drop'
import { getRandomInt } from 'utils/number'

export const POAP_API_URL = process.env.REACT_APP_POAP_API_URL ?? 'https://api.poap.tech'
export const POAP_API_KEY = process.env.REACT_APP_POAP_API_KEY

export const POAP_SCAN_URL = 'https://app.poap.xyz/scan'
export const POAP_GALLERY_URL = 'https://poap.gallery/event'
export const POAP_MOMENTS_URL = 'https://moments.poap.xyz'
export const POAP_COLLECTIONS_URL = 'https://collections.poap.xyz'

export const POAP_FETCH_RETRIES = 5
export const POAP_PROFILE_LIMIT = 20

export interface POAP {
  id: string
  owner: string
  created?: Date
  event?: Drop
}

export function parsePOAP(token: unknown): POAP {
  if (
    token == null ||
    typeof token !== 'object'
  ) {
    throw new Error('Invalid POAP')
  }

  let tokenId: string | undefined
  if (
    'tokenId' in token &&
    token.tokenId != null && (
      typeof token.tokenId === 'number' ||
      typeof token.tokenId === 'string'
    )
  ) {
    tokenId = String(token.tokenId)
  } else if (
    'id' in token &&
    token.id != null && (
      typeof token.id === 'number' ||
      typeof token.id === 'string'
    )
  ) {
    tokenId = String(token.id)
  }
  if (tokenId == null) {
    throw new Error('Invalid POAP ID')
  }

  let owner: string | undefined
  if (
    'owner' in token &&
    token.owner != null
  ) {
    if (
      typeof token.owner === 'object' &&
      'id' in token.owner &&
      token.owner.id != null &&
      typeof token.owner.id === 'string'
    ) {
      owner = token.owner.id
    } else if (typeof token.owner === 'string') {
      owner = token.owner
    }
  }
  if (owner == null) {
    throw new Error('Invalid POAP owner')
  }

  return {
    id: tokenId,
    owner,
    created:
      'created' in token &&
      token.created != null &&
      (
        typeof token.created === 'number' ||
        typeof token.created === 'string'
      )
        ? new Date(token.created)
        : undefined,
    event:
      'event' in token &&
      token.event != null
        ? parseDrop(token.event, /*includeDescription*/false)
        : undefined,
  }
}

/**
 * Finds the first created date on a list of POAPs.
 */
export function findInitialPOAPDate(tokens: POAP[]): Date | null {
  return tokens.reduce(
    (initialDate: Date | null, token: POAP): Date | null => {
      if (
        token &&
        token.created &&
        token.created instanceof Date &&
        (
          initialDate === null ||
          (
            initialDate instanceof Date &&
            initialDate > token.created
          )
        )
      ) {
        return token.created
      }
      return initialDate
    },
    null
  )
}

export function resizeTokenImageUrl(
  imageUrl: string,
  size: string | number | { w: number; h: number },
  imgix: boolean = false,
): string {
  if (imgix) {
    const url = new URL(imageUrl)
    url.host = `poap${Math.trunc(getRandomInt(0, 10))}.imgix.net`
    if (url.pathname.startsWith('/assets.poap.xyz')) {
      url.pathname = url.pathname.substring('/assets.poap.xyz'.length)
    }

    let w: number | undefined
    let h: number | undefined
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
    } else if (typeof size === 'number') {
      w = size
      h = size
    }

    if (w && h) {
      return url.toString() + `?w=${w}&h=${h}&fit=crop`
    }
  } else {
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

  return imageUrl
}
