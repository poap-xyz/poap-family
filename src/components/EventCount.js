import TokenImage from './TokenImage'
import '../styles/event-count.css'

function EventCount({ event, count, size = 64 }) {
  return (
    <div className="event-count">
      <TokenImage event={event} size={size} />
      <span className="count">{count}</span>
    </div>
  )
}

export default EventCount
