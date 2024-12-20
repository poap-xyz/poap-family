import { Drop } from 'models/drop'
import TokenImage from 'components/TokenImage'
import 'styles/event-power.css'

function EventPower({
  event,
  count,
  size = 64,
}: {
  event: Drop
  count: number
  size?: number
}) {
  return (
    <div className="event-power">
      <TokenImage drop={event} size={size} />
      <span className="power">{count}</span>
    </div>
  )
}

export default EventPower
