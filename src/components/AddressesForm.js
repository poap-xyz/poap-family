import { useState } from 'react'
import { parseAddresses } from '../models/address'
import Button from './Button'
import Card from './Card'
import ErrorMessage from './ErrorMessage'
import ButtonClose from './ButtonClose'
import '../styles/addresses-form.css'

function AddressesForm({
  addresses = [],
  onSubmit = (addresses) => {},
  onClose = null,
}) {
  const [value, setValue] = useState(addresses.join('\n') + (addresses.length === 0 ? '' : '\n'))
  const [error, setError] = useState(null)

  const handleChange = (event) => {
    setValue(event.target.value)
    if (event.target.value.length === 0) {
      setError(null)
    }
  }

  const handleSubmit = () => {
    setError(null)
    const addresses = parseAddresses(value, '\n')
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

  const onKeyUp = (event) => {
    if (event.keyCode === 27) { // [Escape]
      if (onClose) {
        onClose()
      }
    } else if (event.ctrlKey && event.keyCode === 13) { // [Enter]
      handleSubmit()
    }
  }

  return (
    <Card>
      <div className="addresses-form">
        <h4>Enter one collector's address or <abbr title="Ethereum Name Service">ENS</abbr> by line</h4>
        {onClose && (
          <div className="addresses-form-actions">
            <ButtonClose onClose={onClose} />
          </div>
        )}
        <textarea
          required={true}
          rows={15}
          cols={45}
          value={value}
          onChange={handleChange}
          onKeyUp={onKeyUp}
          autoFocus={true}
          className="mono"
        >
        </textarea>
        <Button onClick={handleSubmit} disabled={value.length === 0}>Find POAPs In Common</Button>
        {error && (
          <ErrorMessage small={true}>
            <p>{error.message}</p>
          </ErrorMessage>
        )}
      </div>
    </Card>
  )
}

export default AddressesForm
