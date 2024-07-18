import 'styles/warning-icon.css'

function WarningIcon({ title }: { title?: string }) {
  return (
    <span className="warning-icon" title={title}>
      <i className="icon"></i>
    </span>
  )
}

export default WarningIcon
