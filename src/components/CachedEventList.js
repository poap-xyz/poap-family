import { Link } from 'react-router-dom'
import Timestamp from './Timestamp'
import ButtonLink from './ButtonLink'
import TokenImage from './TokenImage'
import '../styles/cached-drops.css'

function CachedEventList({
  maxHeight = undefined,
  tokenImageSize = 48,
  showCachedTs = true,
  showInCommonCount = true,
  showClear = true,
  cachedEvents = [],
  onClear = (eventId) => {},
}) {
  return (
    <ul className="cached-drops" style={{ maxHeight }}>
      {cachedEvents.map((cachedEvent, index) =>
        <li key={`${cachedEvent.id}-${index}`}>
          <div className="cached-drop">
            <div className="cached-poap-image">
              <Link to={`/event/${cachedEvent.id}`}>
                <TokenImage event={cachedEvent} size={tokenImageSize} />
              </Link>
            </div>
            <div className="info">
              <div className="name">
                <h4 title={cachedEvent.name}>{cachedEvent.name}</h4>
                {showClear && <ButtonLink onClick={() => onClear(cachedEvent.id)}>clear</ButtonLink>}
              </div>
              <div className="sub-info">
                {showCachedTs &&
                  <p className="cached right">
                    Cached <Timestamp ts={cachedEvent.cached_ts} />
                  </p>}
                {showInCommonCount &&
                  <p>
                    <span className="in-common-count">{cachedEvent.in_common_count}</span>{' '}
                    <Link to={`/event/${cachedEvent.id}`}>in common</Link>
                  </p>}
              </div>
            </div>
          </div>
        </li>
      )}
    </ul>
  )
}

export default CachedEventList
