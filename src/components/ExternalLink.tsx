import { ReactNode } from 'react'
import { clsx } from 'clsx'
import { OpenNewWindow } from 'iconoir-react'
import 'styles/external-link.css'

function ExternalLink({
  href,
  children,
  className,
  title,
}: {
  href: string
  children?: ReactNode
  className?: string
  title?: string
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={clsx('external-link', className)}
      title={title}
    >
      {children ?? href}
      <OpenNewWindow className="external-link-icon" />
    </a>
  )
}

export default ExternalLink
