import { useState } from 'react'
import { secondsInTheFuture } from '../utils/date'
import { formatByte, formatPercentage } from '../utils/number'
import '../styles/loading.css'

function Loading({ progress, eta, rate, count, total, small = false }) {
  const [showDetails, setShowDetails] = useState(true)

  const hasDetails = typeof eta === 'number' || typeof rate === 'number'

  return (
    <div className={`loading ${small ? 'small' : 'big'}`}>
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

export default Loading
