import { Link } from 'react-router-dom'
import { Drop } from 'models/drop'
import TokenImageZoom from 'components/TokenImageZoom'
import 'styles/drop-header.css'

function DropHeader({
  drop,
  size = 48,
}: {
  drop: Drop
  size: number
}) {
  return (
    <div className="drop-header">
      <div className="drop-header-image">
        <TokenImageZoom drop={drop} zoomSize={512} size={size} />
      </div>
      <div className="drop-header-details">
        <Link to={`/event/${drop.id}`} className="drop-id">#{drop.id}</Link>
        <h2 title={drop.name}>{drop.name}</h2>
      </div>
    </div>
  )
}

export default DropHeader
