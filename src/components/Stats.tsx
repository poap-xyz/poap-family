import { clsx } from 'clsx'
import ShadowText from 'components/ShadowText'
import 'styles/stats.css'

function Stats({ stats, highlight }: {
  stats: Record<string, {
    text: string
    title?: string
    href?: string
    external?: boolean
    small?: boolean
  }>
  highlight?: string
}) {
  const entries = Object.entries(stats).filter(
    ([, stat]) => stat != null
  )

  return (
    <div className={clsx('stats', { highlighted: highlight != null })}>
      <div className="stats-content">
        {entries.map(([statName, stat]) => (
          <div
            key={statName}
            className={clsx('stat',
              highlight === statName ? 'highlight' : 'common',
              stat.href && ' with-link',
            )}
          >
            <div className="stat-content">
              <ShadowText
                medium={!!highlight && highlight !== statName && !stat.small}
                small={stat.small}
              >
                {stat.text}
              </ShadowText>
              {stat.href
                ? (
                  <a
                    href={stat.href}
                    target={stat.external ? '_blank' : undefined}
                    rel={stat.external ? 'noopener noreferrer' : undefined}
                    className={clsx('stat-name',
                      highlight && highlight !== statName
                        ? !stat.small && 'stat-name-medium'
                        : stat.small && 'stat-name-small'
                    )}
                    title={stat.title}
                  >
                    {statName}
                  </a>
                )
                : (
                  <span
                    className={clsx('stat-name',
                      highlight && highlight !== statName
                        ? !stat.small && 'stat-name-medium'
                        : stat.small && 'stat-name-small'
                    )}
                    title={stat.title}
                  >
                    {statName}
                  </span>
                )
              }
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default Stats
