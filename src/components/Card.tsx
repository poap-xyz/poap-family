import { ReactNode } from 'react'
import { clsx } from 'clsx'
import 'styles/card.css'

function Card({
  children,
  fat = false,
  shink = false,
  ilustration,
}: {
  children: ReactNode
  fat?: boolean
  shink?: boolean
  ilustration?: {
    url: string
    pos?: string
  }
}) {
  return (
    <section className="card">
      <div
        className={clsx('card-content', { fat, shink })}
        style={ilustration
          ? {
              backgroundImage: `url(${ilustration.url})`,
              backgroundPosition: ilustration.pos ?? '0 0',
            }
          : undefined
        }
      >
        {children}
      </div>
    </section>
  )
}

export default Card
