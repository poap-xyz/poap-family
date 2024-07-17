import { ReactNode } from 'react'
import Logo from 'components/Logo'
import 'styles/logo-menu.css'

function LogoMenu({ children }: { children: ReactNode }) {
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
