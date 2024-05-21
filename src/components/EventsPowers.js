import PropTypes from 'prop-types'
import { Link } from 'react-router-dom'
import { clsx } from 'clsx'
import { DropProps } from 'models/drop'
import TokenImage from 'components/TokenImage'
import EventPower from 'components/EventPower'
import 'styles/events-powers.css'

/**
 * @param {PropTypes.InferProps<EventsPowers.propTypes>} props
 */
function EventsPowers({
  showAll = false,
  perfectPower,
  selectedEventIds,
  onSelect,
  events,
  powers,
  size = 64,
  children,
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
              ? <TokenImage event={events[eventId]} size={size} />
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

EventsPowers.propTypes = {
  showAll: PropTypes.bool,
  perfectPower: PropTypes.number,
  selectedEventIds: PropTypes.arrayOf(PropTypes.number.isRequired).isRequired,
  onSelect: PropTypes.func.isRequired,
  events: PropTypes.objectOf(
    PropTypes.shape(DropProps).isRequired
  ).isRequired,
  powers: PropTypes.arrayOf(
    PropTypes.shape({
      eventId: PropTypes.number.isRequired,
      power: PropTypes.number.isRequired,
    }).isRequired
  ).isRequired,
  size: PropTypes.number,
  children: PropTypes.node,
}

export default EventsPowers
