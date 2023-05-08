import { Minus } from 'iconoir-react'
import Button from './Button'

function ButtonDelete({ onDelete = () => {}, ...props }) {
  return (
    <Button {...props} icon={<Minus />} onClick={() => onDelete()}>del</Button>
  )
}

export default ButtonDelete
