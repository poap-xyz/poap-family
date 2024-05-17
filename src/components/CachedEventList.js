import PropTypes from 'prop-types'
import { Link } from 'react-router-dom'
import { CachedEventProps } from '../models/api'
import Timestamp from './Timestamp'
import ButtonLink from './ButtonLink'
import TokenImage from './TokenImage'
import '../styles/cached-drops.css'

/**
 * @param {PropTypes.InferProps<CachedEventList.propTypes>} props
 */
function CachedEventList({
  cachedEvents,
  maxHeight,
  tokenImageSize = 48,
  showCachedTs = true,
  showInCommonCount = true,
  showClear = true,
  onClear =
    /**
     * @param {number} eventId
     */
    (eventId) => {},
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
                {showClear && (
                  <ButtonLink onClick={() => onClear(cachedEvent.id)}>clear</ButtonLink>
                )}
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

CachedEventList.propTypes = {
  cachedEvents: PropTypes.arrayOf(PropTypes.shape(CachedEventProps)).isRequired,
  maxHeight: PropTypes.number,
  tokenImageSize: PropTypes.number,
  showCachedTs: PropTypes.bool,
  showInCommonCount: PropTypes.bool,
  showClear: PropTypes.bool,
  onClear: PropTypes.func,
}

export default CachedEventList
