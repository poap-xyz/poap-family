import PropTypes from 'prop-types'
import { clsx } from 'clsx'
import '../styles/button-group.css'

/**
 * @param {PropTypes.InferProps<ButtonGroup.propTypes>} props
 */
function ButtonGroup({
  children,
  right = false,
  vertical = false,
}) {
  return (
    <div
      className={clsx('button-group', {
        right,
        vertical,
      })}
    >
      {children}
    </div>
  )
}

ButtonGroup.propTypes = {
  children: PropTypes.node.isRequired,
  right: PropTypes.bool,
  vertical: PropTypes.bool
}

export default ButtonGroup
