import '../styles/button-link.css'

function ButtonLink({ onClick, children }) {
  return (
    <button className="button-link" onClick={onClick}>
      <span className="button-link-content">{children}</span>
    </button>
  )
}

export default ButtonLink
