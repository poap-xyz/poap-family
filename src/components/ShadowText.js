import '../styles/shadow-text.css'

function ShadowText({ children, grow = false, medium = false }) {
  return (
    <div className="shadow-text">
      <div className={`shadow-text-content${grow ? ' grow' : ''}${medium ? ' medium' : ''}`}>
        <span className="shadow" aria-hidden="true">{children}</span>
        <span className="text">{children}</span>
      </div>
    </div>
  )
}

export default ShadowText
