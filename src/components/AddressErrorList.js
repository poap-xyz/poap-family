import ButtonLink from './ButtonLink'
import ErrorMessage from './ErrorMessage'

function AddressErrorList({ errors, onRetry = (address) => {} }) {
  if (errors.length === 0) {
    return undefined
  }
  return (
    <div className="address-error-list">
      {errors.map((error, index) =>
        <ErrorMessage key={index} style={{ marginBottom: '.1rem' }}>
          <p><code>{error.address}</code></p>
          <p><small>{error.error.message}</small></p>
          <ButtonLink onClick={() => onRetry(error.address)}>retry</ButtonLink>
        </ErrorMessage>
      )}
    </div>
  )
}

export default AddressErrorList
