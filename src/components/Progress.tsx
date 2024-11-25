import { useState } from 'react'
import { clsx } from 'clsx'
import { secondsInTheFuture } from 'utils/date'
import { formatByte, formatPercentage } from 'utils/number'
import 'styles/progress.css'

function Progress({
  value,
  max,
  maxFinal = true,
  showValue = false,
  showPercent = false,
  eta,
  rate,
}: {
  value?: number
  max?: number
  maxFinal?: boolean
  showValue?: boolean
  showPercent?: boolean
  eta?: number
  rate?: number
}) {
  const [showDetails, setShowDetails] = useState<boolean>(true)

  const hasDetails = typeof eta === 'number' || typeof rate === 'number'

  return (
    <div className={clsx('progress', { block: showValue })}>
      <div className="progress-inline">
        <progress
          value={typeof value === 'number' ? value : undefined}
          max={typeof max === 'number' ? max : undefined}
        />
        {showValue && (
          <span className="progress-values">
            {value ?? 0}/<span className={clsx('max', { final: maxFinal })}>{max}</span>
          </span>
        )}
        {showPercent && <span className="progress-percent">
          {hasDetails && (
            <button
              className="show-details"
              onClick={() => setShowDetails((showing) => !showing)}
            >
              {formatPercentage(value ?? 0)}
            </button>
          )}
          {!hasDetails && formatPercentage(value ?? 0)}
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
