import PropTypes from 'prop-types'
import { DropProps } from '../models/drop'
import TokenImage from './TokenImage'
import '../styles/event-count.css'

/**
 * @param {PropTypes.InferProps<EventCount.propTypes>} props
 */
function EventCount({ event, count, size = 64 }) {
  return (
    <div className="event-count">
      <TokenImage event={event} size={size} />
      <span className="count">{count}</span>
    </div>
  )
}

EventCount.propTypes = {
  event: PropTypes.shape(DropProps).isRequired,
  count: PropTypes.number.isRequired,
  size: PropTypes.number,
}

export default EventCount
