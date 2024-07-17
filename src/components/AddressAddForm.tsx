import { useState } from 'react'
import { Plus } from 'iconoir-react'
import { parseAddresses } from 'models/address'
import Button from 'components/Button'
import ErrorMessage from 'components/ErrorMessage'
import 'styles/address-add-form.css'

function AddressAddForm({
  onSubmit = (addresses: string[]) => {},
}) {
  const [value, setValue] = useState<string>('')
  const [error, setError] = useState<Error | null>(null)

  function handleChange(newValue: string): void {
    setValue(newValue)
    if (newValue.length === 0) {
      setError(null)
    }
  }

  function handleClick(): void {
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

  function onKeyUp(keyCode: number): void {
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

export default AddressAddForm
