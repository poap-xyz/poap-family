import {
  isRouteErrorResponse,
  useNavigate,
  useParams,
  useRouteError,
} from 'react-router-dom'
import { parseEventIds } from 'models/event'
import PageError from 'components/PageError'
import ErrorMessage from 'components/ErrorMessage'
import ButtonLink from 'components/ButtonLink'

function EventsPageError() {
  const navigate = useNavigate()
  const error = useRouteError()
  const { eventIds: rawEventIds } = useParams()

  /**
   * @param {number} eventId
   */
  const delEvent = (eventId) => {
    const eventIds = parseEventIds(rawEventIds).filter(
      (paramEventId) => String(paramEventId) !== String(eventId)
    )
    if (eventIds.length === 1) {
      navigate(`/event/${eventIds[0]}`)
    } else if (eventIds.length > 0) {
      navigate(`/events/${eventIds.join(',')}`)
    } else {
      navigate('/')
    }
  }

  /**
   * @param {number[]} eventIds
   */
  const delEvents = (eventIds) => {
    const oldEventIds = eventIds.map((eventId) => String(eventId))
    const newEventIds = parseEventIds(rawEventIds).filter(
      (paramEventId) => oldEventIds.indexOf(String(paramEventId)) === -1
    )
    if (newEventIds.length > 0) {
      navigate(`/events/${newEventIds.join(',')}`)
    } else {
      navigate('/')
    }
  }

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

  if (errorsByEventId) {
    console.error(...Object.values(errorsByEventId))
  }

  return (
    <PageError>
      {errorsByEventId && (
        <>
          {Object.entries(errorsByEventId).map(
            ([rawEventId, error]) => (
              <ErrorMessage key={rawEventId} away={true} error={error}>
                <ButtonLink
                  onClick={() => delEvent(parseInt(rawEventId))}
                >
                  remove
                </ButtonLink>
              </ErrorMessage>
            )
          )}
          <ButtonLink
            onClick={() => {
              delEvents(Object.keys(errorsByEventId).map(
                (rawEventId) => parseInt(rawEventId)
              ))
            }}
          >
            remove all
          </ButtonLink>
        </>
      )}
    </PageError>
  )
}

export default EventsPageError
