import { Xmark } from 'iconoir-react'
import 'styles/button-close.css'

function ButtonClose({
  onClose,
  title,
}: {
  onClose: () => void
  title?: string
}) {
  return (
    <button className="button-close" onClick={() => onClose()} title={title}>
      <Xmark />
    </button>
  )
}

export default ButtonClose
