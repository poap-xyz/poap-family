import { MouseEventHandler, ReactNode } from 'react'
import { clsx } from 'clsx'
import 'styles/button-link.css'

function ButtonLink({
  children,
  onClick,
  className,
  disabled = false,
  title,
}: {
  children: ReactNode
  onClick: MouseEventHandler<HTMLButtonElement>
  className?: string
  disabled?: boolean
  title?: string
}) {
  return (
    <button
      className={clsx('button-link', className)}
      onClick={onClick}
      disabled={disabled}
    >
      <span title={title} className="button-link-content">{children}</span>
    </button>
  )
}

export default ButtonLink
