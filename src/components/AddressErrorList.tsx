import AddressErrorMessage from 'components/AddressErrorMessage'

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
      {errors.map((error) =>
        <AddressErrorMessage
          key={error.address}
          error={error.error}
          address={error.address}
          onRetry={() => onRetry(error.address)}
        />
      )}
    </div>
  )
}

export default AddressErrorList
