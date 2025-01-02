import { Drop } from 'models/drop'
import TokenImage from 'components/TokenImage'
import 'styles/event-power.css'

function EventPower({
  drop,
  count,
  size = 64,
}: {
  drop: Drop
  count: number
  size?: number
}) {
  return (
    <div className="event-power">
      <TokenImage drop={drop} size={size} />
      <span className="power">{count}</span>
    </div>
  )
}

export default EventPower
