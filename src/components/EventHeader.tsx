import { Link } from 'react-router-dom'
import { Drop } from 'models/drop'
import TokenImageZoom from 'components/TokenImageZoom'
import 'styles/event-header.css'

function EventHeader({
  drop,
  size = 48,
}: {
  drop: Drop
  size: number
}) {
  return (
    <div className="event-header">
      <div className="event-header-image">
        <TokenImageZoom drop={drop} zoomSize={512} size={size} />
      </div>
      <div className="event-header-details">
        <Link to={`/event/${drop.id}`} className="event-id">#{drop.id}</Link>
        <h2 title={drop.name}>{drop.name}</h2>
      </div>
    </div>
  )
}

export default EventHeader
