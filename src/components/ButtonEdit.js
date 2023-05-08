import { EditPencil } from 'iconoir-react'
import Button from './Button'

function ButtonEdit({ onEdit = () => {}, ...props }) {
  return (
    <Button {...props} icon={<EditPencil />} onClick={() => onEdit()}>edit</Button>
  )
}

export default ButtonEdit
