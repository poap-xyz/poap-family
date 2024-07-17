import { formatDateAgo } from 'utils/date'

function Timestamp({ ts }: { ts: number }) {
  return (
    <span className="ts" title={new Date(ts * 1000).toLocaleString()}>
      {formatDateAgo(ts)}
    </span>
  )
}

export default Timestamp
