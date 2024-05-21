import PropTypes from 'prop-types'
import { DropProps } from 'models/drop'
import { resizeTokenImageUrl } from 'models/poap'
import 'styles/token-image.css'

/**
 * @param {PropTypes.InferProps<TokenImage.propTypes>} props
 */
function TokenImage({
  event,
  size,
  imgSize,
  resize = true,
  imgix = false,
  original = false,
}) {
  let imageUrl = original
    ? event.original_url ?? event.image_url
    : event.image_url

  if (resize) {
    imageUrl = resizeTokenImageUrl(imageUrl, size, imgix)
  }

  return (
    <img
      src={imageUrl}
      alt={event.name}
      title={event.name}
      className="token-image"
      style={{
        width: `${imgSize ?? size}px`,
        height: `${imgSize ?? size}px`,
      }}
    />
  )
}

TokenImage.propTypes = {
  event: PropTypes.shape(DropProps).isRequired,
  size: PropTypes.number.isRequired,
  imgSize: PropTypes.number,
  resize: PropTypes.bool,
  imgix: PropTypes.bool,
  original: PropTypes.bool,
}

export default TokenImage
