import PropTypes from 'prop-types'
import { clsx } from 'clsx'
import '../styles/error-message.css'

/**
 * @param {PropTypes.InferProps<ErrorMessage.propTypes>} props
 */
function ErrorMessage({
  error,
  title: errorTitle,
  children,
  small = false,
  away = false,
}) {
  let title
  if (error && error.cause) {
    if (error.cause instanceof Error) {
      title = error.cause.message
    } else if (typeof error.cause === 'string') {
      title = error.cause
    }
  }
  return (
    <div className={clsx('error-message', { small, away })}>
      {errorTitle && (
        <h5>{errorTitle}</h5>
      )}
      {error && (
        <p>
          {title
            ? <span title={title}>{error.message}</span>
            : error.message
          }
        </p>
      )}
      {children}
    </div>
  )
}

ErrorMessage.propTypes = {
  error: PropTypes.instanceOf(Error),
  title: PropTypes.node,
  children: PropTypes.node,
  small: PropTypes.bool,
  away: PropTypes.bool,
}

export default ErrorMessage
