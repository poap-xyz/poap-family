import { clsx } from 'clsx'
import '../styles/button.css'

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

export default Button
