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
      className={`button${active ? ' active' : ''}${disabled ? ' disabled' : ''} ${secondary ? 'secondary' : 'primary'}${borderless ? ' borderless' : ''}`}
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
