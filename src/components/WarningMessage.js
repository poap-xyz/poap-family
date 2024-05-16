import PropTypes from 'prop-types'
import '../styles/warning-message.css'

/**
 * @param {PropTypes.InferProps<WarningMessage.propTypes>} props
 */
function WarningMessage({ children }) {
  return (
    <div className="warning-message">
      <div className="warning-message-content">
        {children}
      </div>
    </div>
  )
}

WarningMessage.propTypes = {
  children: PropTypes.node.isRequired,
}

export default WarningMessage
