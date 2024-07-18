import 'styles/checkbox.css'

function Checkbox({
  checked,
  onChange = (checked: boolean) => {},
}: {
  checked: boolean
  onChange: (checked: boolean) => void
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

export default Checkbox
