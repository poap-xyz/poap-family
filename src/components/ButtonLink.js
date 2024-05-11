import { clsx } from 'clsx'
import '../styles/button-link.css'

function ButtonLink({ title, onClick, className, disabled, children }) {
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

export default ButtonLink
