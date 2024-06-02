import PropTypes from 'prop-types'
import 'styles/switch.css'

/**
 * @param {PropTypes.InferProps<Switch.propTypes>} props
 */
function Switch({
  id,
  checked,
  onChange =
    /**
     * @param {boolean} checked
     */
    (checked) => {},
  labelOff = 'No',
  labelOn = 'Yes',
}) {
  return (
    <label className="switch">
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
      <span
        className="switch-slider"
        data-on={labelOn}
        data-off={labelOff}
      />
    </label>
  )
}

Switch.propTypes = {
  id: PropTypes.string.isRequired,
  checked: PropTypes.bool.isRequired,
  onChange: PropTypes.func.isRequired,
  labelOff: PropTypes.string,
  labelOn: PropTypes.string,
}

export default Switch
