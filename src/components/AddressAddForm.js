import PropTypes from 'prop-types'
import { useState } from 'react'
import { Plus } from 'iconoir-react'
import { parseAddresses } from 'models/address'
import Button from 'components/Button'
import ErrorMessage from 'components/ErrorMessage'
import 'styles/address-add-form.css'

/**
 * @param {PropTypes.InferProps<AddressAddForm.propTypes>} props
 */
function AddressAddForm({
  onSubmit =
    /**
     * @param {string[]} addresses
     */
    (addresses) => {},
}) {
  /**
   * @type {ReturnType<typeof useState<string>>}
   */
  const [value, setValue] = useState('')
  /**
   * @type {ReturnType<typeof useState<Error | null>>}
   */
  const [error, setError] = useState(null)

  /**
   * @param {string} newValue
   */
  const handleChange = (newValue) => {
    setValue(newValue)
    if (newValue.length === 0) {
      setError(null)
    }
  }

  const handleClick = () => {
    if (value.length > 0) {
      const addresses = parseAddresses(value, ',')
      if (addresses.length === 0) {
        setError(new Error(`No valid addresses`))
      } else {
        setValue('')
        onSubmit(
          addresses
            .map(({ raw }) => raw)
            .filter((x) => x != null)
        )
      }
    }
  }

  /**
   * @param {number} keyCode
   */
  const onKeyUp = (keyCode) => {
    if (keyCode === 13) { // [Enter]
      handleClick()
    } else if (keyCode === 27) { // [Escape]
      setValue('')
      setError(null)
    }
  }

  return (
    <div className="address-add-form">
      <div className="address-add-container">
        <input
          className="address-add-input"
          type="text"
          required={true}
          size={45}
          value={value}
          onChange={(event) => handleChange(event.target.value)}
          onKeyUp={(event) => onKeyUp(event.keyCode)}
        />
        <Button
          icon={<Plus />}
          secondary={true}
          onClick={() => handleClick()}
          disabled={value.length === 0}
        >
          Add
        </Button>
      </div>
      {error && (
        <ErrorMessage small={true} error={error} />
      )}
    </div>
  )
}

AddressAddForm.propTypes = {
  onSubmit: PropTypes.func.isRequired,
}

export default AddressAddForm
