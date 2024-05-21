import PropTypes from 'prop-types'
import { Link, useNavigate } from 'react-router-dom'
import { CachedEventProps } from 'models/api'
import Timestamp from 'components/Timestamp'
import TokenImageZoom from 'components/TokenImageZoom'
import 'styles/cached-event-list.css'

/**
 * @param {PropTypes.InferProps<CachedEventList.propTypes>} props
 */
function CachedEventList({
  cachedEvents,
  maxHeight,
  tokenImageSize = 48,
  showCachedTs = true,
  showInCommonCount = true,
}) {
  const navigate = useNavigate()

  return (
    <ul className="cached-event-list" style={{ maxHeight: maxHeight ?? undefined }}>
      {cachedEvents.map((cachedEvent, index) =>
        <li
          key={`${cachedEvent.id}-${index}`}
          onClick={(event) => {
            /**
             * @type {HTMLElement | null}
             */
            // @ts-ignore
            let target = event.target
            while (
              target != null &&
              target.nodeName !== 'A' &&
              target.nodeName !== 'BUTTON' &&
              target.nodeName !== 'LI'
            ) {
              target = target.parentElement
            }
            if (target != null && target.nodeName === 'LI') {
              navigate(`/event/${cachedEvent.id}`)
            }
          }}
        >
          <div className="cached-event">
            <div className="cached-event-card">
              <TokenImageZoom
                event={cachedEvent}
                zoomSize={512}
                size={tokenImageSize}
              />
              <Link
                to={`/event/${cachedEvent.id}`}
                className="event-id"
              >
                #{cachedEvent.id}
              </Link>
            </div>
            <div className="cached-event-info">
              <h4 title={cachedEvent.name}>{cachedEvent.name}</h4>
              {(showCachedTs || showInCommonCount) && (
                <div className="cached-event-data">
                  {showCachedTs && (
                    <div className="cached-ts">
                      Cached <Timestamp ts={cachedEvent.cached_ts} />
                    </div>
                  )}
                  {showInCommonCount && (
                    <div>
                      <span className="in-common-count">
                        {cachedEvent.in_common_count}
                      </span>
                      {' '}
                      in common
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </li>
      )}
    </ul>
  )
}

CachedEventList.propTypes = {
  cachedEvents: PropTypes.arrayOf(
    PropTypes.shape(CachedEventProps).isRequired
  ).isRequired,
  maxHeight: PropTypes.number,
  tokenImageSize: PropTypes.number,
  showCachedTs: PropTypes.bool,
  showInCommonCount: PropTypes.bool,
}

export default CachedEventList
