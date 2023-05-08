import { useState } from 'react'
import { secondsInTheFuture } from '../utils/date'
import { formatByte, formatPercentage } from '../utils/number'
import '../styles/progress.css'

function Progress({ value, max, showValue = false, showPercent = false, eta, rate }) {
  const [showDetails, setShowDetails] = useState(true)

  const hasDetails = typeof eta === 'number' || typeof rate === 'number'

  return (
    <div className={`progress${showValue ? ' block' : ''}`}>
      <div className="progress-inline">
        <progress
          value={typeof value === 'number' ? value : undefined}
          max={typeof max === 'number' ? max : undefined}
        />
        {showValue && <span className="progress-values">{value ?? 0}/{max}</span>}
        {showPercent && <span className="progress-percent">
          {hasDetails && (
            <button
              className="show-details"
              onClick={() => setShowDetails((showing) => !showing)}
            >
              {formatPercentage(value)}
            </button>
          )}
          {!hasDetails && formatPercentage(value)}
        </span>}
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
  )
}

export default Progress
