import '../styles/warning-icon.css'

function WarningIcon({ title }) {
  return (
    <span className="warning-icon" title={title}>
      <i className="icon warning"></i>
    </span>
  )
}

export default WarningIcon
