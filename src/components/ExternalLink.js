import { OpenNewWindow } from 'iconoir-react'
import '../styles/external-link.css'

function ExternalLink({ href, className, children }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`external-link${className ? ` ${className}` : ''}`}
    >
      {children ?? href}
      <OpenNewWindow className="external-link-icon" />
    </a>
  )
}

export default ExternalLink
