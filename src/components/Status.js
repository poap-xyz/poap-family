import PropTypes from 'prop-types'
import { clsx } from 'clsx'
import 'styles/status.css'

/**
 * @param {PropTypes.InferProps<Status.propTypes>} props
 */
function Status({
  loading,
  caching,
  error,
}) {
  return (
    <div
      className={clsx('status',
        loading && 'status-loading',
        caching && 'status-caching',
        error && 'status-error',
      )}
    >
      {loading && 'Loading'}
      {caching && 'Caching'}
      {error && 'Error'}
    </div>
  )
}

Status.propTypes = {
  loading: PropTypes.bool,
  caching: PropTypes.bool,
  error: PropTypes.bool,
}

export default Status
