import { clsx } from 'clsx'
import { OpenNewWindow } from 'iconoir-react'
import '../styles/link-button.css'

function LinkButton({
  title,
  icon,
  href,
  children,
  external = false,
  secondary = false,
}) {
  if (external && !icon) {
    icon = <OpenNewWindow width={16} height={16} />
  }
  return (
    <a
      href={href}
      title={title}
      className={clsx('link-button', secondary ? 'secondary' : 'primary')}
      target={external ? '_blank' : undefined}
      rel={external ? 'noopener noreferrer' : undefined}
    >
      <span className="link-button-content">
        {icon && (
          <span className="link-button-icon">
            {icon}
          </span>
        )}
        {children}
      </span>
    </a>
  )
}

export default LinkButton
