import { useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { EventInCommonCount } from 'models/api'
import { useDrops } from 'stores/drops'
import TokenImageZoom from 'components/TokenImageZoom'
import Loading from 'components/Loading'
import ErrorMessage from 'components/ErrorMessage'
import ButtonLink from 'components/ButtonLink'
import 'styles/event-in-common-count-list.css'

function EventInCommonCountList({
  eventsInCommonCount,
  maxHeight,
  tokenImageSize = 48,
  loadingSize = 'medium',
  showInCommonCount = true,
}: {
  eventsInCommonCount: EventInCommonCount[]
  maxHeight?: number
  tokenImageSize?: number
  loadingSize?: 'icon' | 'small' | 'medium' | 'big'
  showInCommonCount?: boolean
}) {
  const navigate = useNavigate()

  const {
    drops,
    error,
    errors,
    loading,
    fetchDrops,
    retryDrops,
  } = useDrops()

  useEffect(
    () => {
      fetchDrops(
        eventsInCommonCount.map((eventInCommonCount) => eventInCommonCount.id)
      )
    },
    [eventsInCommonCount, fetchDrops]
  )

  return (
    <>
      {error && (
        <ErrorMessage error={error} />
      )}
      <ul
        className="event-in-common-count-list"
        style={{ maxHeight: maxHeight ?? undefined }}
      >
        {eventsInCommonCount.map((eventInCommonCount, index) =>
          <li
            key={`${eventInCommonCount.id}-${index}`}
            onClick={(event) => {
              let target = event.target as HTMLElement | null
              while (
                target != null &&
                target.nodeName !== 'A' &&
                target.nodeName !== 'BUTTON' &&
                target.nodeName !== 'LI'
              ) {
                target = target.parentElement
              }
              if (target != null && target.nodeName === 'LI') {
                navigate(`/drop/${eventInCommonCount.id}`)
              }
            }}
          >
            <div className="event-in-common-count">
              <div className="event-in-common-count-card">
                {drops[eventInCommonCount.id] && (
                  <TokenImageZoom
                    drop={drops[eventInCommonCount.id]}
                    zoomSize={512}
                    size={tokenImageSize}
                  />
                )}
                {(
                  !drops[eventInCommonCount.id] &&
                  loading[eventInCommonCount.id]
                ) && (
                  <Loading size={loadingSize} />
                )}
                {errors[eventInCommonCount.id] && (
                  <ErrorMessage error={errors[eventInCommonCount.id]}>
                    <ButtonLink
                      onClick={() => retryDrops([eventInCommonCount.id])}
                    >
                      retry
                    </ButtonLink>
                  </ErrorMessage>
                )}
                <Link
                  to={`/drop/${eventInCommonCount.id}`}
                  className="event-id"
                >
                  #{eventInCommonCount.id}
                </Link>
              </div>
              <div className="event-in-common-count-info">
                <h4 title={drops[eventInCommonCount.id]?.name}>
                  {drops[eventInCommonCount.id]?.name ?? 'Loading..'}
                </h4>
                {showInCommonCount && (
                  <div className="event-in-common-count-data">
                    <div>
                      <span className="in-common-count">
                        {eventInCommonCount.in_common_count}
                      </span>
                      {' '}
                      in common
                    </div>
                  </div>
                )}
              </div>
            </div>
          </li>
        )}
      </ul>
    </>
  )
}

export default EventInCommonCountList
