import ShadowText from './ShadowText'
import '../styles/stats.css'

function Stats({ stats, highlight }) {
  const entries = Object.entries(stats).filter(([statName, stat]) => stat != null)

  return (
    <div className={`stats${highlight ? ' highlighted' : ''}`}>
      <div className="stats-content">
        {entries.map(([statName, stat], index) => (
          <div
            key={statName}
            className={`stat ${highlight === statName ? 'highlight' : 'common'}${typeof stat === 'object' && stat.link ? ' with-link' : ''}`}
            style={{
              paddingLeft: highlight !== statName && index === 0 ? '.5rem' : undefined,
              paddingRight: highlight !== statName && index + 1 === entries.length ? '.5rem' : undefined,
            }}
          >
            <div className="stat-content">
              {typeof stat === 'object'
                ? (
                  <>
                    <ShadowText
                      medium={highlight && highlight !== statName && !stat.small}
                      small={stat.small}
                    >
                      {stat.text}
                    </ShadowText>
                    {stat.link
                      ? (
                        <a
                          href={stat.link}
                          target={stat.external ? '_blank' : undefined}
                          rel={stat.external ? 'noopener noreferrer' : undefined}
                          className={`stat-name${highlight && highlight !== statName && !stat.small ? ' stat-name-medium' : (stat.small ? ' stat-name-small' : '')}`}
                          title={stat.title}
                        >
                          {statName}
                        </a>
                      )
                      : (
                        <span
                          className={`stat-name${highlight && highlight !== statName && !stat.small ? ' stat-name-medium' : (stat.small ? ' stat-name-small' : '')}`}
                          title={stat.title}
                        >
                          {statName}
                        </span>
                      )
                    }
                  </>
                ) : (
                  <>
                    <ShadowText medium={highlight && highlight !== statName}>{stat}</ShadowText>
                    <span className={`stat-name${highlight && highlight !== statName ? ' stat-name-medium' : ''}`}>{statName}</span>
                  </>
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
