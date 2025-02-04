import {
  isRouteErrorResponse,
  useNavigate,
  useParams,
  useRouteError,
} from 'react-router-dom'
import { joinDropIds, parseDropIds } from 'models/drop'
import PageError from 'components/PageError'
import ErrorMessage from 'components/ErrorMessage'
import ButtonLink from 'components/ButtonLink'

function DropsPageError() {
  const navigate = useNavigate()
  const error = useRouteError()
  const { dropIds: rawDropIds } = useParams()

  function delDrop(dropId: number): void {
    const dropIds = parseDropIds(String(rawDropIds)).filter(
      (paramDropId) => String(paramDropId) !== String(dropId)
    )
    if (dropIds.length === 1) {
      navigate(`/drop/${dropIds[0]}`)
    } else if (dropIds.length > 0) {
      navigate(`/drops/${joinDropIds(dropIds)}`)
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
      navigate(`/drops/${joinDropIds(newDropIds)}`)
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
    'errorsByDropIds' in error.data &&
    error.data.errorsByDropIds != null &&
    typeof error.data.errorsByDropIds === 'object'
  )
    ? error.data.errorsByDropIds
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

export default DropsPageError
