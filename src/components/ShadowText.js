import PropTypes from 'prop-types'
import { clsx } from 'clsx'
import 'styles/shadow-text.css'

/**
 * @param {PropTypes.InferProps<ShadowText.propTypes>} props
 */
function ShadowText({
  children,
  grow = false,
  medium = false,
  small = false,
}) {
  return (
    <div className="shadow-text">
      <div
        className={clsx('shadow-text-content', {
          grow,
          medium,
          small,
        })}
      >
        <span className="shadow" aria-hidden="true">{children}</span>
        <span className="text">{children}</span>
      </div>
    </div>
  )
}

ShadowText.propTypes = {
  children: PropTypes.node.isRequired,
  grow: PropTypes.bool,
  medium: PropTypes.bool,
  small: PropTypes.bool,
}

export default ShadowText
