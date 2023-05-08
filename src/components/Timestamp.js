import { formatDateAgo } from '../utils/date'

function Timestamp({ ts }) {
  return (
    <span className="ts" title={new Date(ts * 1000).toLocaleString()}>
      {formatDateAgo(ts)}
    </span>
  )
}

export default Timestamp
