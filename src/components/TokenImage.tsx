import { Drop } from 'models/drop'
import { CachedEvent } from 'models/api'
import { resizeTokenImageUrl } from 'models/poap'
import 'styles/token-image.css'

function TokenImage({
  event,
  size,
  imgSize,
  resize = true,
  imgix = false,
  original = false,
}: {
  event: Drop | CachedEvent
  size: number
  imgSize?: number
  resize?: boolean
  imgix?: boolean
  original?: boolean
}) {
  let imageUrl = original && 'original_url' in event
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

export default TokenImage
