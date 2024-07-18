import { useState } from 'react'
import { Fish } from 'iconoir-react'
import Button from 'components/Button'
import ButtonGroup from 'components/ButtonGroup'
import 'styles/input-passphrase-form.css'

function InputPassphraseForm({
  onSubmit,
  onClose,
}: {
  onSubmit: (passphrase: string) => void
  onClose?: () => void
}) {
  const [passphrase, setPassphrase] = useState<string>('')

  function handleSubmit(): void {
    onSubmit(passphrase)
  }

  function onChange(newValue: string): void {
    setPassphrase(newValue)
  }

  function onKeyUp(keyCode: number): void {
    if (keyCode === 27) { // [Escape]
      if (onClose) {
        onClose()
      }
    } else if (keyCode === 13) { // [Enter]
      handleSubmit()
    }
  }

  return (
    <div className="input-passphrase-form">
      <h4>Enter passphrase to authenticate</h4>
      <input
        type="password"
        className="input-passphrase"
        value={passphrase}
        onChange={(event) => onChange(event.target.value)}
        onKeyUp={(event) => onKeyUp(event.keyCode)}
        autoFocus={true}
      />
      <ButtonGroup>
        <Button
          icon={<Fish />}
          onClick={handleSubmit}
          disabled={passphrase.length === 0}
        >
          Login
        </Button>
      </ButtonGroup>
    </div>
  )
}

export default InputPassphraseForm
