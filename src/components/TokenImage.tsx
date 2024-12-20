import { Drop } from 'models/drop'
import { CachedEvent } from 'models/api'
import { resizeTokenImageUrl } from 'models/poap'
import 'styles/token-image.css'

function TokenImage({
  drop,
  size,
  imgSize,
  resize = true,
  imgix = false,
  original = false,
}: {
  drop: Drop | CachedEvent
  size: number
  imgSize?: number
  resize?: boolean
  imgix?: boolean
  original?: boolean
}) {
  let imageUrl = original && 'original_url' in drop
    ? drop.original_url ?? drop.image_url
    : drop.image_url

  if (resize) {
    imageUrl = resizeTokenImageUrl(imageUrl, size, imgix)
  }

  return (
    <img
      src={imageUrl}
      alt={drop.name}
      title={drop.name}
      className="token-image"
      style={{
        width: `${imgSize ?? size}px`,
        height: `${imgSize ?? size}px`,
      }}
    />
  )
}

export default TokenImage
