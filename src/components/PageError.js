import { isRouteErrorResponse, useRouteError } from 'react-router-dom'
import ButtonLink from './ButtonLink'
import CenterPage from './CenterPage'
import '../styles/page-error.css'

const errorClasses = {
  400: 'badrequest',
  404: 'notfound',
  503: 'unavailable',
}

function PageError({ onRemoveAllEvents = null, onRemoveEvent = null }) {
  const error = useRouteError()
  const errorType = errorClasses[error.status] ?? 'unknown'
  const errors = [error]
  if (error?.data && typeof error.data.errorsByEventId === 'object') {
    for (const subError of Object.values(error.data.errorsByEventId)) {
      errors.push(subError)
    }
  }
  console.error(...errors)
  return (
    <CenterPage>
      <div className={`page-error ${errorType}`}>
        <i className="icon warning"></i>
        {error.statusText && <p>{error.statusText}</p>}
        {error.message && <p>{error.message}</p>}
        {isRouteErrorResponse(error) && typeof error.data.errorsByEventId === 'object' && (
          <>
            {onRemoveAllEvents && (
                <>{' '}<ButtonLink onClick={() => onRemoveAllEvents(Object.keys(error.data.errorsByEventId))}>remove all</ButtonLink></>
            )}
            {Object.entries(error.data.errorsByEventId).map(
              ([eventId, error]) => (
                <p key={eventId}>
                  {error.message}
                  {error.status && (
                    <>{' '}(status <span title={error.statusText ? error.statusText : ''}>{error.status}</span>)</>
                  )}
                  {onRemoveEvent && (
                    <>{' '}<ButtonLink onClick={() => onRemoveEvent(eventId)}>remove</ButtonLink></>
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
