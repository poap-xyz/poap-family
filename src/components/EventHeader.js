import { Link } from 'react-router-dom'
import TokenImage from './TokenImage'
import '../styles/event-header.css'

function EventHeader({ event, linkToEvent = false }) {
  return (
    <div className="event-header">
      <div className="event-header-image">
        {linkToEvent
          ? (
            <Link to={`/event/${event.id}`}>
              <TokenImage event={event} size={48} resize={true} />
            </Link>
          )
          : <TokenImage event={event} size={48} resize={true} />
        }
      </div>
      <div className="event-header-info">
        <div className="event-id">#{event.id}</div>
        <h2 title={event.name}>{event.name}</h2>
      </div>
    </div>
  )
}

export default EventHeader
