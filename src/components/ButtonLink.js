import PropTypes from 'prop-types'
import { clsx } from 'clsx'
import '../styles/button-link.css'

/**
 * @param {PropTypes.InferProps<ButtonLink.propTypes>} props
 */
function ButtonLink({
  title,
  onClick,
  className,
  disabled = false,
  children,
}) {
  return (
    <button
      className={clsx('button-link', className)}
      onClick={onClick}
      disabled={disabled}
    >
      <span title={title} className="button-link-content">{children}</span>
    </button>
  )
}

ButtonLink.propTypes = {
  title: PropTypes.string,
  onClick: PropTypes.func.isRequired,
  className: PropTypes.string,
  disabled: PropTypes.bool,
  children: PropTypes.node,
}

export default ButtonLink
