import '../styles/poap.css'

function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min) + min); // The maximum is exclusive and the minimum is inclusive
}

function TokenImage({ event, size, resize = true, imgix = false, original = false, ...props }) {
  let imageUrl = original ? event.original_url ?? event.image_url : event.image_url
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
      style={{ width: `${size}px`, height: `${size}px` }}
      {...props}
    />
  )
}

export default TokenImage
