import PropTypes from 'prop-types'
import { useState } from 'react'
import { parseAddresses } from '../models/address'
import Button from './Button'
import Card from './Card'
import ErrorMessage from './ErrorMessage'
import ButtonClose from './ButtonClose'
import '../styles/addresses-form.css'

/**
 * @param {PropTypes.InferProps<AddressesForm.propTypes>} props
 */
function AddressesForm({
  addresses = [],
  onSubmit =
    /**
     * @param {string[]} addresses
     */
    (addresses) => {},
  onClose,
}) {
  /**
   * @type {ReturnType<typeof useState<string>>}
   */
  const [value, setValue] = useState(addresses.join('\n') + (addresses.length === 0 ? '' : '\n'))
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

  /**
   * @param {number} keyCode
   * @param {boolean} [ctrlKey]
   */
  const onKeyUp = (keyCode, ctrlKey = false) => {
    if (keyCode === 27) { // [Escape]
      if (onClose) {
        onClose()
      }
    } else if (ctrlKey && keyCode === 13) { // [Enter]
      handleSubmit()
    }
  }

  return (
    <Card>
      <div className="addresses-form">
        <h4>
          Enter one collector's address or{' '}
          <abbr title="Ethereum Name Service">ENS</abbr> by line
        </h4>
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
          onChange={(event) => handleChange(event.target.value)}
          onKeyUp={(event) => onKeyUp(event.keyCode, event.ctrlKey)}
          autoFocus={true}
          className="mono"
        >
        </textarea>
        <Button onClick={() => handleSubmit()} disabled={value.length === 0}>
          Find POAPs In Common
        </Button>
        {error && (
          <ErrorMessage small={true} error={error} />
        )}
      </div>
    </Card>
  )
}

AddressesForm.propTypes = {
  addresses: PropTypes.arrayOf(PropTypes.string).isRequired,
  onSubmit: PropTypes.func.isRequired,
  onClose: PropTypes.func,
}

export default AddressesForm
