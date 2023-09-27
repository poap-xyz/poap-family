import '../styles/button-link.css'

function ButtonLink({ title, onClick, className, disabled, children }) {
  return (
    <button
      className={`button-link${className ? ` ${className}` : ''}`}
      onClick={onClick}
      disabled={disabled}
    >
      <span title={title} className="button-link-content">{children}</span>
    </button>
  )
}

export default ButtonLink
