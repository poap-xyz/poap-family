import PropTypes from 'prop-types'
import { CollectionProps, resizeCollectionImageUrl } from 'models/collection'
import 'styles/collection-logo.css'

/**
 * @param {PropTypes.InferProps<CollectionLogo.propTypes>} props
 */
function CollectionLogo({
  collection,
  size,
  imgSize,
  resize = true,
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

CollectionLogo.propTypes = {
  collection: PropTypes.shape(CollectionProps).isRequired,
  size: PropTypes.number.isRequired,
  imgSize: PropTypes.number,
  resize: PropTypes.bool,
}

export default CollectionLogo
