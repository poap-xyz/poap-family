import PropTypes from 'prop-types'
import { Link } from 'react-router-dom'
import POAP from 'assets/images/POAP.png'
import 'styles/logo.css'

/**
 * @param {PropTypes.InferProps<Logo.propTypes>} props
 */
function Logo({
  linkTo = '/',
  alt = 'Go to POAP Family homepage',
  size = 64,
}) {
  return (
    <div className="logo">
      <Link to={linkTo}>
        <img src={POAP} alt={alt} style={{ height: `${size}px` }} />
      </Link>
    </div>
  )
}

Logo.propTypes = {
  linkTo: PropTypes.string,
  alt: PropTypes.string,
  size: PropTypes.number,
}

export default Logo
