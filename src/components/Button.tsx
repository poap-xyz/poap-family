import { MouseEventHandler, ReactNode } from 'react'
import { clsx } from 'clsx'
import Loading from 'components/Loading'
import 'styles/button.css'

function Button({
  onClick,
  children,
  active = false,
  disabled = false,
  secondary = false,
  borderless = false,
  loading = false,
  icon,
  title,
}: {
  onClick: MouseEventHandler<HTMLButtonElement>
  children: ReactNode
  active?: boolean
  disabled?: boolean
  secondary?: boolean
  borderless?: boolean
  loading?: boolean
  icon?: ReactNode
  title?: string
}) {
  const isLoading = loading && !disabled
  return (
    <button
      className={clsx('button', {
        active,
        disabled,
        primary: !secondary,
        secondary,
        borderless,
        loading: isLoading,
      })}
      disabled={disabled}
      onClick={onClick}
      title={title}
    >
      <span className="button-content">
        {icon && !isLoading && (
          <span className="button-content-icon">
            {icon}
          </span>
        )}
        {isLoading && (
          <div className="button-content-loading">
            <Loading size="icon" />
          </div>
        )}
        {children}
      </span>
    </button>
  )
}

export default Button
