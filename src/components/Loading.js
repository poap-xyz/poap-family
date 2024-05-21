import PropTypes from 'prop-types'
import { useState } from 'react'
import { clsx } from 'clsx'
import { secondsInTheFuture } from 'utils/date'
import { formatByte, formatPercentage } from 'utils/number'
import 'styles/loading.css'

/**
 * @param {PropTypes.InferProps<Loading.propTypes>} props
 */
function Loading({
  progress,
  eta,
  rate,
  count,
  total,
  small = false,
  title,
}) {
  /**
   * @type {ReturnType<typeof useState<boolean>>}
   */
  const [showDetails, setShowDetails] = useState(true)

  const hasDetails = typeof eta === 'number' || typeof rate === 'number'

  return (
    <div className={clsx('loading', small ? 'small' : 'big')}>
      {title && <h4>{title}</h4>}
      <div className="loading-inner">
        <div className="lds-dual-ring">
          {typeof progress === 'number' && (
            <div className="progress">
              {hasDetails && (
                <button
                  className="show-details"
                  onClick={() => setShowDetails((showing) => !showing)}
                >
                  {formatPercentage(progress)}
                </button>
              )}
              {!hasDetails && formatPercentage(progress)}
            </div>
          )}
          {typeof count === 'number' && (
            <>
              <div className="count">{count}</div>
              {typeof total === 'number' && (
                <div className="total">{total}</div>
              )}
            </>
          )}
        </div>
        {showDetails && (
          <div className="details">
            {typeof eta === 'number' && (
              <div className="eta"><i>ETA</i> {secondsInTheFuture(eta)}</div>
            )}
            {typeof rate === 'number' && (
              <div className="rate"><i>Rate</i> {formatByte(rate)}/s</div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

Loading.propTypes = {
  progress: PropTypes.number,
  eta: PropTypes.number,
  rate: PropTypes.number,
  count: PropTypes.number,
  total: PropTypes.number,
  small: PropTypes.bool,
  title: PropTypes.string,
}

export default Loading
