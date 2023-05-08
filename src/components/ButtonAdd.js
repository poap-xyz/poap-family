import { Plus } from 'iconoir-react'
import Button from './Button'

function ButtonAdd({ onAdd = () => {}, ...props }) {
  return (
    <Button {...props} icon={<Plus />} onClick={() => onAdd()}>add</Button>
  )
}

export default ButtonAdd
