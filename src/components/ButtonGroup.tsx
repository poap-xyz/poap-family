import { ReactNode } from 'react'
import { clsx } from 'clsx'
import 'styles/button-group.css'

function ButtonGroup({
  children,
  right = false,
  vertical = false,
}: {
  children: ReactNode
  right?: boolean
  vertical?: boolean
}) {
  return (
    <div
      className={clsx('button-group', {
        right,
        vertical,
      })}
    >
      {children}
    </div>
  )
}

export default ButtonGroup
