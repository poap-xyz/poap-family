import PropTypes from 'prop-types'
import { Xmark } from 'iconoir-react'
import 'styles/button-close.css'

/**
 * @param {PropTypes.InferProps<ButtonClose.propTypes>} props
 */
function ButtonClose({
  onClose = () => {}
}) {
  return (
    <button className="button-close" onClick={() => onClose()}>
      <Xmark />
    </button>
  )
}

ButtonClose.propTypes = {
  onClose: PropTypes.func.isRequired,
}

export default ButtonClose
