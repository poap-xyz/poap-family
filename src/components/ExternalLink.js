import PropTypes from 'prop-types'
import { clsx } from 'clsx'
import { OpenNewWindow } from 'iconoir-react'
import 'styles/external-link.css'

/**
 * @param {PropTypes.InferProps<ExternalLink.propTypes>} props
 */
function ExternalLink({
  href,
  children,
  className,
  title,
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={clsx('external-link', className)}
      title={title}
    >
      {children ?? href}
      <OpenNewWindow className="external-link-icon" />
    </a>
  )
}

ExternalLink.propTypes = {
  href: PropTypes.string,
  children: PropTypes.node,
  className: PropTypes.string,
  title: PropTypes.string,
}

export default ExternalLink
