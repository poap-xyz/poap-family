import TokenImage from './TokenImage'
import '../styles/event-count.css'

function EventCount({ event, count, linkToGallery = false }) {
  return (
    <div className="event-count">
      {linkToGallery &&
        <a href={`https://poap.gallery/event/${event.id}`} title={event.name}>
          <TokenImage event={event} size={64} />
          <span className="count">{count}</span>
        </a>
      }
      {!linkToGallery &&
        // eslint-disable-next-line jsx-a11y/anchor-is-valid
        <a id={`event-${event.id}`} title={event.name}>
          <TokenImage event={event} size={64} />
          <span className="count">{count}</span>
        </a>
      }
    </div>
  )
}

export default EventCount
