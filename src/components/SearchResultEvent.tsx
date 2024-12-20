import { Link } from 'react-router-dom'
import { clsx } from 'clsx'
import { Drop } from 'models/drop'
import TokenImage from 'components/TokenImage'
import Checkbox from 'components/Checkbox'
import 'styles/search-result-event.css'

function SearchResultEvent({
  event,
  checked,
  onCheckChange,
  className,
}: {
  event: Drop
  checked: boolean
  onCheckChange: (checked: boolean) => void
  className?: string
}) {
  return (
    <div className={clsx('search-result-event', className)}>
      <div className="drop-info">
        <div className="drop-image">
          <Link to={`/event/${event.id}`} className="drop-link">
            <TokenImage drop={event} size={18} />
          </Link>
        </div>
        <div className="drop-name">
          <h4 title={event.name}>{event.name}</h4>
        </div>
        <div className="drop-select">
          <Checkbox
            checked={checked}
            onChange={onCheckChange}
          />
        </div>
      </div>
    </div>
  )
}

export default SearchResultEvent
