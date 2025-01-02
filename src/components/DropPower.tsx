import { Drop } from 'models/drop'
import TokenImage from 'components/TokenImage'
import 'styles/drop-power.css'

function DropPower({
  drop,
  count,
  size = 64,
}: {
  drop: Drop
  count: number
  size?: number
}) {
  return (
    <div className="drop-power">
      <TokenImage drop={drop} size={size} />
      <span className="drop-power-value">{count}</span>
    </div>
  )
}

export default DropPower
