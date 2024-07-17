import { Link } from 'react-router-dom'
import POAP from 'assets/images/POAP.png'
import 'styles/logo.css'

function Logo({
  linkTo = '/',
  alt = 'Go to POAP Family homepage',
  size = 64,
}: {
  linkTo?: string
  alt?: string
  size?: number
}) {
  return (
    <div className="logo">
      <Link to={linkTo}>
        <img src={POAP} alt={alt} style={{ height: `${size}px` }} />
      </Link>
    </div>
  )
}

export default Logo
