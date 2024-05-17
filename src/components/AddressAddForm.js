import { useState } from 'react'
import { Plus } from 'iconoir-react'
import { parseAddresses } from '../models/address'
import Button from './Button'
import ErrorMessage from './ErrorMessage'
import '../styles/address-add.css'

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
            .filter((x) => x)
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
    <div className="address-add">
      <div className="address-add-form">
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

export default AddressAddForm
