import clsx from 'clsx'
import { Xmark } from 'iconoir-react'
import 'styles/button-close.css'

function ButtonClose({
  onClose,
  title,
  className,
}: {
  onClose: () => void
  title?: string
  className?: string
}) {
  return (
    <button
      className={clsx('button-close', className)}
      onClick={() => onClose()}
      title={title}
    >
      <Xmark />
    </button>
  )
}

export default ButtonClose
