import { useState } from 'react'
import {
  COLLECTIONS_LIMIT,
  Collection,
  resizeCollectionImageUrl,
} from 'models/collection'
import { POAP_COLLECTIONS_URL } from 'models/poap'
import ButtonLink from 'components/ButtonLink'
import 'styles/collection-list.css'

function CollectionList({
  collections,
  showLogo = false,
}: {
  collections: Collection[]
  showLogo?: boolean
}) {
  const [showAll, setShowAll] = useState<boolean>(false)

  let collectionsToShow = collections.slice()

  const total = collections.length
  const limit = COLLECTIONS_LIMIT
  const hasMore = total > limit

  if (hasMore && !showAll) {
    collectionsToShow = collectionsToShow.slice(0, limit)
  }

  return (
    <div className="collection-list">
      {collectionsToShow.map((collection) => (
        <a
          key={collection.id}
          title={collection.title}
          href={`${POAP_COLLECTIONS_URL}/${collection.slug}/${collection.id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="collection"
        >
          <svg>
            <mask id={`m${collection.id}`} fill="#FFF">
              <rect id={`r${collection.id}`} width="100%" height="100%" />
              <circle id={`c${collection.id}`} r="12" fill="#000" />
              <use xlinkHref={`#c${collection.id}`} x="100%" />
              <use xlinkHref={`#c${collection.id}`} y="100%" />
              <use xlinkHref={`#c${collection.id}`} x="100%" y="100%" />
            </mask>
            <use xlinkHref={`#r${collection.id}`} mask={`url(#m${collection.id})`} />
          </svg>
          <div className="collection-banner">
            {collection.banner_image_url && (
              <img
                src={resizeCollectionImageUrl(collection.banner_image_url, {
                  w: 192,
                  h: 48,
                })}
                onError={(event) => {
                  event.currentTarget.style.display = 'none'
                }}
                alt=""
              />
            )}
          </div>
          <div className="collection-info">
            {showLogo && collection.logo_image_url && (
              <div className="collection-logo">
                <img
                  src={resizeCollectionImageUrl(collection.logo_image_url, {
                    w: 32,
                    h: 32,
                  })}
                  alt=""
                />
              </div>
            )}
            <span className="collection-title">{collection.title}</span>
          </div>
        </a>
      ))}
      {hasMore && (
        <div className="show-more">
          <ButtonLink onClick={() => setShowAll((prevShowAll) => !prevShowAll)}>
            {showAll ? `show ${limit}` : `show all ${total}`}
          </ButtonLink>
        </div>
      )}
    </div>
  )
}

export default CollectionList
