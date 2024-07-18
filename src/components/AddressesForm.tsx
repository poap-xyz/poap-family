import { useState } from 'react'
import { parseAddresses } from 'models/address'
import Button from 'components/Button'
import Card from 'components/Card'
import ErrorMessage from 'components/ErrorMessage'
import ButtonClose from 'components/ButtonClose'
import 'styles/addresses-form.css'

function AddressesForm({
  addresses,
  onSubmit,
  onClose,
}: {
  addresses: string[]
  onSubmit: (addresses: string[]) => void
  onClose?: () => void
}) {
  const [value, setValue] = useState<string>(addresses.join('\n') + (addresses.length === 0 ? '' : '\n'))
  const [error, setError] = useState<Error | null>(null)

  function handleChange(newValue: string): void {
    setValue(newValue)
    if (newValue.length === 0) {
      setError(null)
    }
  }

  function handleSubmit(): void {
    setError(null)
    const addresses = parseAddresses(value, '\n')
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

  function onKeyUp(keyCode: number, ctrlKey: boolean = false): void {
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

export default AddressesForm
