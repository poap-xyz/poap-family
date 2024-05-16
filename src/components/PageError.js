import { isRouteErrorResponse, useNavigate, useRouteError } from 'react-router-dom'
import { clsx } from 'clsx'
import ButtonLink from './ButtonLink'
import CenterPage from './CenterPage'
import '../styles/page-error.css'

const CLASSES = {
  400: 'badrequest',
  404: 'notfound',
  503: 'unavailable',
}

const STATUS_TEXT = {
  400: 'Bad Request',
  404: 'Not Found',
  503: 'Unavailable',
}

function PageError({ onRemoveAllEvents = null, onRemoveEvent = null }) {
  const navigate = useNavigate()
  const error = useRouteError()
  const errorStatus = (
      error != null &&
      typeof error === 'object' &&
      'status' in error &&
      error.status != null &&
      typeof error.status === 'number'
    )
      ? error.status
      : undefined
  const errorStatusText = (
      error != null &&
      typeof error === 'object' &&
      'statusText' in error &&
      error.statusText != null &&
      typeof error.statusText === 'string'
    )
      ? error.statusText
      : undefined
  const errorType = CLASSES[errorStatus] ?? 'unknown'
  const errorsByEventId = (
      isRouteErrorResponse(error) &&
      error != null &&
      typeof error === 'object' &&
      'data' in error &&
      error.data != null &&
      typeof error.data === 'object' &&
      'errorsByEventId' in error.data &&
      error.data.errorsByEventId != null &&
      typeof error.data.errorsByEventId === 'object'
    )
      ? error.data.errorsByEventId
      : undefined

  console.error(error, ...Object.values(errorsByEventId ?? {}))

  const reload = () => {
    navigate(0)
  }

  return (
    <CenterPage>
      <div className={clsx('page-error', errorType)}>
        <i className="icon warning"></i>
        {(STATUS_TEXT[errorStatus] || errorStatusText) && (
          <p>
            {STATUS_TEXT[errorStatus] && (
              <b>{STATUS_TEXT[errorStatus]}</b>
            )}
            {errorStatusText}
          </p>
        )}
        {(
          error != null &&
          typeof error === 'object' &&
          'message' in error &&
          error.message != null &&
          typeof error.message === 'number'
        ) && (
          <p>{error.message}</p>
        )}
        <ButtonLink onClick={() => reload()}>reload</ButtonLink>
        {errorsByEventId && (
          <>
            {onRemoveAllEvents && (
              <>
                {' '}
                <ButtonLink
                  onClick={() => {
                    onRemoveAllEvents(Object.keys(errorsByEventId).map(
                      (rawEventId) => parseInt(rawEventId)
                    ))
                  }}
                >
                  remove all
                </ButtonLink>
              </>
            )}
            {Object.entries(errorsByEventId).map(
              ([rawEventId, error]) => (
                <p key={rawEventId}>
                  {(
                    error != null &&
                    typeof error === 'object' &&
                    'statusText' in error &&
                    error.statusText != null &&
                    typeof error.statusText === 'number'
                  ) && (
                    <b>{error.statusText}</b>
                  )}
                  {(
                    error != null &&
                    typeof error === 'object' &&
                    'message' in error &&
                    error.message != null &&
                    typeof error.message === 'number'
                  ) && (
                    error.message
                  )}
                  {(
                    error != null &&
                    typeof error === 'object' &&
                    'status' in error &&
                    error.status != null &&
                    typeof error.status === 'number'
                  ) && (
                    <>
                      {' '}
                      (
                        status{' '}
                        <span title={STATUS_TEXT[error.status]}>
                          {error.status}
                        </span>
                      )
                    </>
                  )}
                  {onRemoveEvent && (
                    <>
                      {' '}
                      <ButtonLink
                        onClick={() => onRemoveEvent(parseInt(rawEventId))}
                      >
                        remove
                      </ButtonLink>
                    </>
                  )}
                </p>
              )
            )}
          </>
        )}
      </div>
    </CenterPage>
  )
}

export default PageError
