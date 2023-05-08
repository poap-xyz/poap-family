import '../styles/warning-message.css'

function WarningMessage({ children }) {
  return (
    <div className="warning-message">
      <div className="warning-message-content">
        {children}
      </div>
    </div>
  )
}

export default WarningMessage
