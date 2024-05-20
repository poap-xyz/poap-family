import PropTypes from 'prop-types'
import 'styles/center-page.css'

/**
 * @param {PropTypes.InferProps<CenterPage.propTypes>} props
 */
function CenterPage({ children }) {
  return (
    <div className="center-page">
      {children}
    </div>
  )
}

CenterPage.propTypes = {
  children: PropTypes.node.isRequired,
}

export default CenterPage
