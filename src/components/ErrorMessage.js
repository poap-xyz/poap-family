import '../styles/error-message.css'

function ErrorMessage({ children, style, small = false }) {
  return (
    <div className={`error-message${small ? ' small' : ''}`} style={style}>
      {children}
    </div>
  )
}

export default ErrorMessage
