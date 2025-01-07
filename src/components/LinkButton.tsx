import { ReactNode } from 'react'
import { clsx } from 'clsx'
import { OpenNewWindow } from 'iconoir-react'
import Loading from 'components/Loading'
import 'styles/link-button.css'

function LinkButton({
  href,
  title,
  icon,
  children,
  external = false,
  secondary = false,
  disabled = false,
  loading = false,
  className,
}: {
  href: string
  title?: string
  icon?: ReactNode
  children?: ReactNode
  external?: boolean
  secondary?: boolean
  disabled?: boolean
  loading?: boolean
  className?: string
}) {
  if (external && !icon) {
    icon = <OpenNewWindow width={16} height={16} />
  }
  return (
    <a
      href={href}
      title={title}
      className={clsx('link-button', className,
        secondary ? 'secondary' : 'primary',
        {
          disabled,
          loading,
        },
      )}
      aria-disabled={disabled || loading}
      target={external ? '_blank' : undefined}
      rel={external ? 'noopener noreferrer' : undefined}
    >
      <span className="link-button-content">
        {icon && !loading && (
          <span className="link-button-icon">
            {icon}
          </span>
        )}
        {loading && (
          <div className="link-button-loading">
            <Loading size="icon" />
          </div>
        )}
        {children}
      </span>
    </a>
  )
}

export default LinkButton
