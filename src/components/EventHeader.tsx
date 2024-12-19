import { Link } from 'react-router-dom'
import { Drop } from 'models/drop'
import TokenImageZoom from 'components/TokenImageZoom'
import 'styles/event-header.css'

function EventHeader({
  event,
  size = 48,
}: {
  event: Drop
  size: number
}) {
  return (
    <div className="event-header">
      <div className="event-header-image">
        <TokenImageZoom drop={event} zoomSize={512} size={size} />
      </div>
      <div className="event-header-details">
        <Link to={`/event/${event.id}`} className="event-id">#{event.id}</Link>
        <h2 title={event.name}>{event.name}</h2>
      </div>
    </div>
  )
}

export default EventHeader
