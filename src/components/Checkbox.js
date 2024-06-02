import PropTypes from 'prop-types'
import 'styles/checkbox.css'

/**
 * @param {PropTypes.InferProps<Checkbox.propTypes>} props
 */
function Checkbox({
  checked,
  onChange =
    /**
     * @param {boolean} checked
     */
    (checked) => {},
}) {
  return (
    <input
      className="checkbox"
      type="checkbox"
      checked={checked}
      onChange={(event) => onChange(event.target.checked)}
    />
  )
}

Checkbox.propTypes = {
  checked: PropTypes.bool.isRequired,
  onChange: PropTypes.func.isRequired,
}

export default Checkbox
