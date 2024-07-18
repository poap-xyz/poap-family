import { MouseEventHandler, ReactNode } from 'react'
import { clsx } from 'clsx'
import 'styles/button.css'

function Button({
  onClick,
  children,
  active = false,
  disabled = false,
  secondary = false,
  borderless = false,
  icon,
  title,
}: {
  onClick: MouseEventHandler<HTMLButtonElement>
  children: ReactNode
  active?: boolean
  disabled?: boolean
  secondary?: boolean
  borderless?: boolean
  icon?: ReactNode
  title?: string
}) {
  return (
    <button
      className={clsx('button', {
        active,
        disabled,
        primary: !secondary,
        secondary,
        borderless,
      })}
      disabled={disabled}
      onClick={onClick}
      title={title}
    >
      <span className="button-content">
        {icon && (
          <span className="button-content-icon">
            {icon}
          </span>
        )}
        {children}
      </span>
    </button>
  )
}

export default Button
