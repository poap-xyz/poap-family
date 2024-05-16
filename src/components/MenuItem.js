import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { clsx } from 'clsx'
import '../styles/menu-item.css'

function MenuItem({
  icon,
  label,
  title,
  href,
  to,
  open: initialOpen = false,
  external = false,
  onClick,
  children,
}) {
  const navigate = useNavigate()

  /**
   * @type {ReturnType<typeof useState<boolean>>}
   */
  const [open, setOpen] = useState(initialOpen)

  const handleClick = (event) => {
    event.preventDefault()
    if (children) {
      setOpen((o) => !o)
    }
    if (onClick) {
      onClick()
    }
    if (to) {
      navigate(to)
    }
  }

  return (
    <div className={clsx('menu-item', { open })}>
      {href && !to && !onClick && !children ? (
        <a
          href={href}
          className="menu-link"
          target={external ? '_blank' : undefined}
          rel={external ? 'noopener noreferrer' : undefined}
        >
        {icon
          ? <span className="menu-link-icon" title={title ?? label}>{icon}</span>
          : <span className="menu-link-label" title={title}>{label}</span>}
        </a>
      ) : (
        <button className="menu-button" onClick={handleClick}>
          {icon
            ? <span className="menu-button-icon" title={title ?? label}>{icon}</span>
            : <span className="menu-button-label" title={title}>{label}</span>}
        </button>
      )}
      {children && (
        <div className="menu-item-content" style={{ display: open ? 'block' : 'none' }}>
          {children}
        </div>
      )}
    </div>
  )
}

export default MenuItem
