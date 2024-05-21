import PropTypes from 'prop-types'
import { clsx } from 'clsx'
import { OpenNewWindow } from 'iconoir-react'
import 'styles/link-button.css'

/**
 * @param {PropTypes.InferProps<LinkButton.propTypes>} props
 */
function LinkButton({
  href,
  title,
  icon,
  children,
  external = false,
  secondary = false,
  className,
}) {
  if (external && !icon) {
    icon = <OpenNewWindow width={16} height={16} />
  }
  return (
    <a
      href={href}
      title={title}
      className={clsx('link-button', className,
        secondary ? 'secondary' : 'primary',
      )}
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

LinkButton.propTypes = {
  href: PropTypes.string.isRequired,
  title: PropTypes.string,
  icon: PropTypes.element,
  children: PropTypes.node,
  external: PropTypes.bool,
  secondary: PropTypes.bool,
  className: PropTypes.string,
}

export default LinkButton
