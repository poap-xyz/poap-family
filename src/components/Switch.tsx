import 'styles/switch.css'

function Switch({
  id,
  checked,
  onChange = (checked: boolean) => {},
  labelOff = 'No',
  labelOn = 'Yes',
}: {
  id: string
  checked: boolean
  onChange?: (checked: boolean) => void
  labelOff?: string
  labelOn?: string
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

export default Switch
