import PropTypes from 'prop-types'
import { formatDateAgo } from '../utils/date'

/**
 * @param {PropTypes.InferProps<Timestamp.propTypes>} props
 */
function Timestamp({ ts }) {
  return (
    <span className="ts" title={new Date(ts * 1000).toLocaleString()}>
      {formatDateAgo(ts)}
    </span>
  )
}

Timestamp.propTypes = {
  ts: PropTypes.number.isRequired,
}

export default Timestamp
