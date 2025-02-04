import { getErrorCauseMessage } from 'models/error'
import ButtonLink from 'components/ButtonLink'
import 'styles/address-error-message.css'

function AddressErrorMessage({
  error,
  address,
  onRetry,
}: {
  error: unknown
  address: string
  onRetry?: () => void
}) {
  const causeMessage = getErrorCauseMessage(error)

  return (
    <p className="address-error-message">
      <code>[{address}]</code>
      {' '}
      <span title={causeMessage}>
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
    </p>
  )
}

export default AddressErrorMessage
