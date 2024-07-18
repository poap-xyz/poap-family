import { Minus } from 'iconoir-react'
import Button from 'components/Button'

function ButtonDelete({
  onDelete,
  title,
}: {
  onDelete: () => void
  title?: string
}) {
  return (
    <Button
      title={title}
      secondary={true}
      icon={<Minus />}
      onClick={() => onDelete()}
    >
      del
    </Button>
  )
}

export default ButtonDelete
