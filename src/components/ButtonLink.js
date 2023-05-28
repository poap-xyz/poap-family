import '../styles/button-link.css'

function ButtonLink({ title, onClick, className, children }) {
  return (
    <button className={`button-link${className ? ` ${className}` : ''}`} onClick={onClick}>
      <span title={title} className="button-link-content">{children}</span>
    </button>
  )
}

export default ButtonLink
