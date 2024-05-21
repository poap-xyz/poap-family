import PropTypes from 'prop-types'
import ButtonLink from 'components/ButtonLink'
import ErrorMessage from 'components/ErrorMessage'

/**
 * @param {PropTypes.InferProps<AddressErrorList.propTypes>} props
 */
function AddressErrorList({
  errors,
  onRetry =
    /**
     * @param {string} address
     */
    (address) => {},
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
