import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import '../styles/menu-item.css'

function MenuItem({
  icon,
  label,
  title,
  href,
  to,
  children,
  opened = false,
  onClick = () => {},
}) {
  const navigate = useNavigate()
  const [open, setOpen] = useState(opened)

  const handleClick = (event) => {
    event.preventDefault()
    if (children) {
      setOpen((o) => !o)
    }
    onClick()
    if (href) {
      window.location.href = href
    }
    if (to) {
      navigate(to)
    }
  }

  return (
    <div className={`menu-item${open ? ' active' : ''}`}>
      <button className="menu-button" onClick={handleClick}>
        {icon
          ? <span className="menu-button-icon" title={title ?? label}>{icon}</span>
          : <span className="menu-button-label" title={title}>{label}</span>}
      </button>
      {children && (
        <div className="menu-item-content" style={{ display: open ? 'block' : 'none' }}>
          {children}
        </div>
      )}
    </div>
  )
}

export default MenuItem
