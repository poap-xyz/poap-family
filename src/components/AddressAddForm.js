import { useState } from 'react'
import { Plus } from 'iconoir-react'
import { parseAddresses } from '../models/address'
import Button from './Button'
import ErrorMessage from './ErrorMessage'
import '../styles/address-add.css'

function AddressAddForm({ onSubmit = (addresses) => {} }) {
  const [value, setValue] = useState('')
  const [error, setError] = useState(null)

  const handleChange = (event) => {
    setValue(event.target.value)
    if (event.target.value.length === 0) {
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

  const onKeyUp = (event) => {
    if (event.keyCode === 13) { // [Enter]
      handleClick()
    } else if (event.keyCode === 27) { // [Escape]
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
          onChange={handleChange}
          onKeyUp={onKeyUp}
        />
        <Button
          icon={<Plus />}
          secondary={true}
          onClick={handleClick}
          disabled={value.length === 0}
        >
          Add
        </Button>
      </div>
      {error && (
        <ErrorMessage small={true}>
          <p>{error.message}</p>
        </ErrorMessage>
      )}
    </div>
  )
}

export default AddressAddForm
