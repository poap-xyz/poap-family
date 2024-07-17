import { Collection, resizeCollectionImageUrl } from 'models/collection'
import 'styles/collection-logo.css'

function CollectionLogo({
  collection,
  size,
  imgSize,
  resize = true,
}: {
  collection: Collection
  size?: number
  imgSize?: number
  resize?: boolean
}) {
  let imageUrl = collection.logo_image_url

  if (resize) {
    imageUrl = resizeCollectionImageUrl(imageUrl, size)
  }

  return (
    <img
      src={imageUrl}
      alt={collection.title ?? ''}
      className="collection-logo"
      style={{
        width: `${imgSize ?? size}px`,
        height: `${imgSize ?? size}px`,
      }}
    />
  )
}

export default CollectionLogo
