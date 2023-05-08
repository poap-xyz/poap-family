import '../styles/switch.css'

function Switch({ checked, onChange, labelOff = 'No', labelOn = 'Yes' }) {
  return (
    <label className="switch">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
      />
      <span
        className="switch-slider"
        data-on={labelOn}
        data-off={labelOff}
      />
    </label>
  )
}

export default Switch
