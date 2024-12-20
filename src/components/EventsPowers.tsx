import { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { clsx } from 'clsx'
import { Drop } from 'models/drop'
import TokenImage from 'components/TokenImage'
import EventPower from 'components/EventPower'
import 'styles/events-powers.css'

function EventsPowers({
  showAll = false,
  perfectPower,
  selectedEventIds,
  onSelect,
  events,
  powers,
  size = 64,
  children,
}: {
  showAll?: boolean
  perfectPower?: number
  selectedEventIds: number[]
  onSelect: (eventId: number) => void
  events: Record<number, Drop>
  powers: Array<{
    eventId: number
    power: number
  }>
  size?: number
  children?: ReactNode
}) {
  return (
    <div className={clsx('events-powers', showAll && 'show-all')}>
      {powers.map(({ eventId, power }) => (
        <div
          key={eventId}
          className={clsx('event-power-card', {
            selected: selectedEventIds.includes(eventId),
            perfect: perfectPower === power,
          })}
          title={events[eventId].name}
        >
          <button
            className="event-select-button"
            onClick={() => onSelect(eventId)}
            style={{
              width: `${size}px`,
              height: `${size}px`,
            }}
          >
            {perfectPower === power
              ? <TokenImage drop={events[eventId]} size={size} />
              : <EventPower
                event={events[eventId]}
                count={power}
                size={size}
              />
            }
          </button>
          <Link
            to={`/event/${eventId}`}
            className="event-id"
          >
            #{eventId}
          </Link>
        </div>
      ))}
      {children}
    </div>
  )
}

export default EventsPowers
