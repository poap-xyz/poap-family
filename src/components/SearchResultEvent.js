import PropTypes from 'prop-types'
import { Link } from 'react-router-dom'
import { clsx } from 'clsx'
import { DropProps } from 'models/drop'
import TokenImage from 'components/TokenImage'
import Checkbox from 'components/Checkbox'
import 'styles/search-result-event.css'

/**
 * @param {PropTypes.InferProps<SearchResultEvent.propTypes>} props
 */
function SearchResultEvent({
  event,
  checked,
  onCheckChange,
  className,
}) {
  return (
    <div className={clsx('search-result-event', className)}>
      <div className="drop-info">
        <div className="drop-image">
          <Link to={`/event/${event.id}`} className="drop-link">
            <TokenImage event={event} size={18} />
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

SearchResultEvent.propTypes = {
  event: PropTypes.shape(DropProps).isRequired,
  checked: PropTypes.bool.isRequired,
  onCheckChange: PropTypes.func.isRequired,
  className: PropTypes.string,
}

export default SearchResultEvent
