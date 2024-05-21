import PropTypes from 'prop-types'
import { Link } from 'react-router-dom'
import { DropProps } from 'models/drop'
import TokenImageZoom from 'components/TokenImageZoom'
import 'styles/event-header.css'

/**
 * @param {PropTypes.InferProps<EventHeader.propTypes>} props
 */
function EventHeader({ event, size = 48 }) {
  return (
    <div className="event-header">
      <div className="event-header-image">
        <TokenImageZoom event={event} zoomSize={512} size={size} />
      </div>
      <div className="event-header-details">
        <Link to={`/event/${event.id}`} className="event-id">#{event.id}</Link>
        <h2 title={event.name}>{event.name}</h2>
      </div>
    </div>
  )
}

EventHeader.propTypes = {
  event: PropTypes.shape(DropProps).isRequired,
  size: PropTypes.number,
}

export default EventHeader
