import PropTypes from 'prop-types'
import ButtonLink from './ButtonLink'
import ErrorMessage from './ErrorMessage'

/**
 * @param {PropTypes.InferProps<AddressErrorList.propTypes>} props
 */
function AddressErrorList({
  errors,
  onRetry = (address) => {},
}) {
  if (errors.length === 0) {
    return undefined
  }
  return (
    <div className="address-error-list">
      {errors.map((error, index) =>
        <ErrorMessage key={index}>
          <p><code>{error.address}</code></p>
          <p><small>{error.error.message}</small></p>
          <ButtonLink onClick={() => onRetry(error.address)}>retry</ButtonLink>
        </ErrorMessage>
      )}
    </div>
  )
}

AddressErrorList.propTypes = {
  errors: (
    PropTypes.arrayOf(
      PropTypes.shape({
        address: PropTypes.string.isRequired,
        error: PropTypes.instanceOf(Error).isRequired,
      })
    ).isRequired
  ),
  onRetry: PropTypes.func.isRequired,
}

export default AddressErrorList
