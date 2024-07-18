import { Plus } from 'iconoir-react'
import Button from 'components/Button'

function ButtonAdd({
  onAdd,
  title,
}: {
  onAdd: () => void
  title?: string
}) {
  return (
    <Button
      title={title}
      secondary={true}
      borderless={true}
      icon={<Plus />}
      onClick={() => onAdd()}
    >
      add
    </Button>
  )
}

export default ButtonAdd
