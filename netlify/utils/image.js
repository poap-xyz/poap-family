export function renderEventsImages(events, canvas, size, pos) {
  if (events.length === 0) {
    return []
  }

  const angle = 360 / events.length
  const offset = size / 2
  const radius = (canvas - size) / 2
  const center = pos + offset + radius

  const images = []

  events.forEach((event, i) => {
    const x = center + radius * Math.cos(angle * i * Math.PI / 180)
    const y = center + radius * Math.sin(angle * i * Math.PI / 180)

    images.push({
      type: 'img',
      props: {
        key: event.id,
        src: `${event.image_url}?format=png&size=medium`,
        alt: event.name,
        width: size,
        height: size,
        style: {
          display: 'flex',
          position: 'absolute',
          top: `${Math.round(y - offset)}px`,
          left: `${Math.round(x - offset)}px`,
          width: `${size}px`,
          height: `${size}px`,
          borderRadius: '50%',
        },
      },
    })
  })

  return images
}
