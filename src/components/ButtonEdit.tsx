import { EditPencil } from 'iconoir-react'
import Button from 'components/Button'

function ButtonEdit({
  onEdit,
  title,
}: {
  onEdit: () => void
  title?: string
}) {
  return (
    <Button
      title={title}
      secondary={true}
      borderless={true}
      icon={<EditPencil />}
      onClick={() => onEdit()}
    >
      edit
    </Button>
  )
}

export default ButtonEdit
