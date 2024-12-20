import {
  isRouteErrorResponse,
  useNavigate,
  useParams,
  useRouteError,
} from 'react-router-dom'
import { parseDropIds } from 'models/drop'
import PageError from 'components/PageError'
import ErrorMessage from 'components/ErrorMessage'
import ButtonLink from 'components/ButtonLink'

function EventsPageError() {
  const navigate = useNavigate()
  const error = useRouteError()
  const { eventIds: rawDropIds } = useParams()

  function delDrop(dropId: number): void {
    const eventIds = parseDropIds(String(rawDropIds)).filter(
      (paramEventId) => String(paramEventId) !== String(dropId)
    )
    if (eventIds.length === 1) {
      navigate(`/event/${eventIds[0]}`)
    } else if (eventIds.length > 0) {
      navigate(`/events/${eventIds.join(',')}`)
    } else {
      navigate('/')
    }
  }

  function delDrops(dropIds: number[]): void {
    const oldDropIds = dropIds.map((dropId) => String(dropId))
    const newDropIds = parseDropIds(String(rawDropIds)).filter(
      (paramDropId) => oldDropIds.indexOf(String(paramDropId)) === -1
    )
    if (newDropIds.length > 0) {
      navigate(`/events/${newDropIds.join(',')}`)
    } else {
      navigate('/')
    }
  }

  const errorsByDropId = (
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

  if (errorsByDropId) {
    console.error(...Object.values(errorsByDropId))
  }

  return (
    <PageError>
      {errorsByDropId && (
        <>
          {Object.entries(errorsByDropId).map(
            ([rawDropId, error]) => (
              <ErrorMessage key={rawDropId} away={true} error={error}>
                <ButtonLink
                  onClick={() => delDrop(parseInt(rawDropId))}
                >
                  remove
                </ButtonLink>
              </ErrorMessage>
            )
          )}
          <ButtonLink
            onClick={() => {
              delDrops(Object.keys(errorsByDropId).map(
                (rawDropId) => parseInt(rawDropId)
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
