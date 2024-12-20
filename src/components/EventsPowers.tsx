import { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { clsx } from 'clsx'
import { Drop, DropPower } from 'models/drop'
import TokenImage from 'components/TokenImage'
import EventPower from 'components/EventPower'
import 'styles/events-powers.css'

function EventsPowers({
  showAll = false,
  perfectPower,
  selectedDropIds,
  onSelect,
  drops,
  powers,
  size = 64,
  children,
}: {
  showAll?: boolean
  perfectPower?: number
  selectedDropIds: number[]
  onSelect: (dropId: number) => void
  drops: Record<number, Drop>
  powers: DropPower[]
  size?: number
  children?: ReactNode
}) {
  return (
    <div className={clsx('events-powers', showAll && 'show-all')}>
      {powers.map(({ dropId, power }) => (
        <div
          key={dropId}
          className={clsx('event-power-card', {
            selected: selectedDropIds.includes(dropId),
            perfect: perfectPower === power,
          })}
          title={drops[dropId].name}
        >
          <button
            className="event-select-button"
            onClick={() => onSelect(dropId)}
            style={{
              width: `${size}px`,
              height: `${size}px`,
            }}
          >
            {perfectPower === power
              ? <TokenImage drop={drops[dropId]} size={size} />
              : <EventPower
                drop={drops[dropId]}
                count={power}
                size={size}
              />
            }
          </button>
          <Link
            to={`/event/${dropId}`}
            className="event-id"
          >
            #{dropId}
          </Link>
        </div>
      ))}
      {children}
    </div>
  )
}

export default EventsPowers
