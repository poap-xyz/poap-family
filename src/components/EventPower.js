import PropTypes from 'prop-types'
import { DropProps } from 'models/drop'
import TokenImage from 'components/TokenImage'
import 'styles/event-power.css'

/**
 * @param {PropTypes.InferProps<EventPower.propTypes>} props
 */
function EventPower({ event, count, size = 64 }) {
  return (
    <div className="event-power">
      <TokenImage event={event} size={size} />
      <span className="power">{count}</span>
    </div>
  )
}

EventPower.propTypes = {
  event: PropTypes.shape(DropProps).isRequired,
  count: PropTypes.number.isRequired,
  size: PropTypes.number,
}

export default EventPower
