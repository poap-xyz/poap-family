import PropTypes from 'prop-types'
import 'styles/warning-icon.css'

/**
 * @param {PropTypes.InferProps<WarningIcon.propTypes>} props
 */
function WarningIcon({ title }) {
  return (
    <span className="warning-icon" title={title}>
      <i className="icon"></i>
    </span>
  )
}

WarningIcon.propTypes = {
  title: PropTypes.string,
}

export default WarningIcon
