import PropTypes from 'prop-types'
import { useState } from 'react'
import { Fish } from 'iconoir-react'
import Button from './Button'
import ButtonGroup from './ButtonGroup'
import '../styles/input-passphrase.css'

/**
 * @param {PropTypes.InferProps<InputPassphraseForm.propTypes>} props
 */
function InputPassphraseForm({
  onSubmit = (passphrase) => {},
  onClose = () => {},
}) {
  /**
   * @type {ReturnType<typeof useState<string>>}
   */
  const [passphrase, setPassphrase] = useState('')

  const handleSubmit = () => {
    onSubmit(passphrase)
  }

  const onChange = (event) => {
    setPassphrase(event.target.value)
  }

  const onKeyUp = (event) => {
    if (event.keyCode === 27) { // [Escape]
      if (onClose) {
        onClose()
      }
    } else if (event.keyCode === 13) { // [Enter]
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
        onChange={onChange}
        onKeyUp={onKeyUp}
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

InputPassphraseForm.propTypes = {
  onSubmit: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
}

export default InputPassphraseForm
