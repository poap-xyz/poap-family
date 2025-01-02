import { Link } from 'react-router-dom'
import { clsx } from 'clsx'
import { joinDropIds } from 'models/drop'
import {
  CollectionWithDrops,
  resizeCollectionImageUrl,
} from 'models/collection'
import CollectionLogo from 'components/CollectionLogo'
import Checkbox from 'components/Checkbox'
import 'styles/search-result-collection.css'

function SearchResultCollection({
  collection,
  checked,
  onCheckChange,
  className,
}: {
  collection: CollectionWithDrops
  checked: boolean
  onCheckChange: (checked: boolean) => void
  className?: string
}) {
  return (
    <div className={clsx('search-result-collection', className)}>
      {collection.banner_image_url && (
        <div className="collection-banner">
          <img
            src={resizeCollectionImageUrl(collection.banner_image_url, {
              w: 480,
              h: 40,
            })}
            alt=""
          />
        </div>
      )}
      <div className="collection-info">
        <div className="collection-logo">
          {collection.logo_image_url && (
            <Link
              to={`/drops/${joinDropIds(collection.dropIds)}`}
              className="collection-link"
            >
              <CollectionLogo collection={collection} size={18} />
            </Link>
          )}
        </div>
        <div className="collection-title">
          <h4 title={collection.title}>{collection.title}</h4>
          <div className="collection-count">
            <span>{collection.dropIds.length}</span>
          </div>
        </div>
        <div className="collection-select">
          <Checkbox
            checked={checked}
            onChange={onCheckChange}
          />
        </div>
      </div>
    </div>
  )
}

export default SearchResultCollection
