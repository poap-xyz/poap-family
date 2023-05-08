import Logo from './Logo'
import '../styles/logo-menu.css'

function LogoMenu({ children }) {
  return (
    <div className="logo-menu">
      <div className="logo-menu-wrap">
        <div className="logo-menu-card">
          <Logo />
          <div className="logo-menu-content">
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}

export default LogoMenu
