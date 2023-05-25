import { Link } from 'react-router-dom'
import TokenImage from './TokenImage'
import '../styles/event-header.css'

function EventHeader({ event, size = 48 }) {
  return (
    <div className="event-header">
      <div className="event-header-image">
        <TokenImage event={event} size={size} resize={true} />
      </div>
      <div className="event-header-info">
        <Link className="event-id">#{event.id}</Link>
        <h2 title={event.name}>{event.name}</h2>
      </div>
    </div>
  )
}

export default EventHeader
