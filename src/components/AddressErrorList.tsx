import ButtonLink from 'components/ButtonLink'
import ErrorMessage from 'components/ErrorMessage'

function AddressErrorList({
  errors,
  onRetry,
}: {
  errors: Array<{
    address: string
    error: Error
  }>
  onRetry: (address: string) => void
}) {
  if (errors.length === 0) {
    return null
  }

  return (
    <div className="address-error-list">
      {errors.map((error, index) =>
        <ErrorMessage
          key={index}
          title={<code>{error.address}</code>}
          error={error.error}
        >
          <ButtonLink onClick={() => onRetry(error.address)}>retry</ButtonLink>
        </ErrorMessage>
      )}
    </div>
  )
}

export default AddressErrorList
