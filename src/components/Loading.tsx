import { ReactNode, useState } from 'react'
import { clsx } from 'clsx'
import { secondsInTheFuture } from 'utils/date'
import { formatByte, formatPercentage } from 'utils/number'
import 'styles/loading.css'

function Loading({
  progress,
  eta,
  rate,
  count,
  total,
  totalFinal = true,
  size = 'big',
  title,
}: {
  progress?: number
  eta?: number
  rate?: number
  count?: number
  total?: number
  totalFinal?: boolean
  size?: 'icon' | 'small' | 'medium' | 'big'
  title?: ReactNode
}) {
  const [showDetails, setShowDetails] = useState<boolean>(true)

  const hasDetails = typeof eta === 'number' || typeof rate === 'number'

  return (
    <div className={clsx('loading', size)}>
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
                <div className={clsx('total', { final: totalFinal })}>{total}</div>
              )}
            </>
          )}
        </div>
        {showDetails && (typeof eta === 'number' || typeof rate === 'number') && (
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
