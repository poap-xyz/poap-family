import '../styles/button-link.css'

function ButtonLink({ onClick, className, children }) {
  return (
    <button className={`button-link${className ? ` ${className}` : ''}`} onClick={onClick}>
      <span className="button-link-content">{children}</span>
    </button>
  )
}

export default ButtonLink
