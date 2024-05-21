import PropTypes from 'prop-types'
import Logo from 'components/Logo'
import 'styles/logo-menu.css'

/**
 * @param {PropTypes.InferProps<LogoMenu.propTypes>} props
 */
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

LogoMenu.propTypes = {
  children: PropTypes.node.isRequired,
}

export default LogoMenu
