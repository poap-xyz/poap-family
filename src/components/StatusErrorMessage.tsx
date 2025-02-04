import { getErrorCauseMessage } from 'models/error'
import ButtonLink from 'components/ButtonLink'
import 'styles/status-error-message.css'

function StatusErrorMessage({
  error,
  onRetry,
}: {
  error: unknown
  onRetry?: () => void
}) {
  if (error == null) {
    return null
  }

  const cause = getErrorCauseMessage(error)

  return (
    <>
      <span
        className="status-error-message"
        title={cause}
      >
        {(
          typeof error === 'object' &&
          'message' in error &&
          error.message != null &&
          typeof error.message === 'string'
        ) ? (
          <>{error.message}</>
        ) : (
          <>{error ? String(error) : 'Unknown error'}</>
        )}
      </span>
      {onRetry && (
        <>
          {' '}
          <ButtonLink onClick={() => onRetry()}>
            retry
          </ButtonLink>
        </>
      )}
    </>
  )
}

export default StatusErrorMessage
