import { clsx } from 'clsx'
import '../styles/error-message.css'

function ErrorMessage({ children, style, small = false }) {
  return (
    <div
      className={clsx('error-message', { small })}
      style={style}
    >
      {children}
    </div>
  )
}

export default ErrorMessage
