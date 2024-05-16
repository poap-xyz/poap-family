import PropTypes from 'prop-types'
import { clsx } from 'clsx'
import '../styles/button.css'

/**
 * @param {PropTypes.InferProps<Button.propTypes>} props
 */
function Button({
  onClick,
  children,
  active = false,
  disabled = false,
  secondary = false,
  borderless = false,
  icon,
  title,
}) {
  return (
    <button
      className={clsx('button', {
        active,
        disabled,
        secondary,
        borderless,
      })}
      disabled={disabled}
      onClick={onClick}
      title={title}
    >
      <span className="button-content">
        {icon && (
          <span className="button-content-icon">
            {icon}
          </span>
        )}
        {children}
      </span>
    </button>
  )
}

Button.propTypes = {
  onClick: PropTypes.func.isRequired,
  children: PropTypes.node.isRequired,
  active: PropTypes.bool,
  disabled: PropTypes.bool,
  secondary: PropTypes.bool,
  borderless: PropTypes.bool,
  icon: PropTypes.element,
  title: PropTypes.string,
}

export default Button
