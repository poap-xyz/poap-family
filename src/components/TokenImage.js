import PropTypes from 'prop-types'
import { DropProps } from '../models/drop'
import { getRandomInt } from '../utils/number'
import '../styles/poap.css'

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
    if (imgix) {
      const url = new URL(imageUrl)
      url.host = `poap${Math.trunc(getRandomInt(0, 10))}.imgix.net`
      if (url.pathname.startsWith('/assets.poap.xyz')) {
        url.pathname = url.pathname.substring('/assets.poap.xyz'.length)
      }
      if (size) {
        imageUrl = url.toString() + `?w=${size}&h=${size}`
      } else {
        imageUrl = url.toString()
      }
    } else {
      let poapSize = 'small'

      if (size <= 64) {
        poapSize = 'xsmall'
      } else if (size > 64 && size <= 128) {
        poapSize = 'small'
      } else if (size > 128 && size <= 256) {
        poapSize = 'medium'
      } else if (size > 256 && size <= 512) {
        poapSize = 'large'
      } else if (size > 512) {
        poapSize = 'xlarge'
      }

      imageUrl += `?size=${poapSize}`
    }
  }

  return (
    <img
      src={imageUrl}
      alt={event.name}
      title={event.name}
      className="poap"
      style={{ width: `${imgSize ?? size}px`, height: `${imgSize ?? size}px` }}
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
