import PropTypes from 'prop-types'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getLastEvents } from 'loaders/api'
import CachedEventList from 'components/CachedEventList'
import Card from 'components/Card'
import Loading from 'components/Loading'
import ErrorMessage from 'components/ErrorMessage'
import Pagination from 'components/Pagination'
import ButtonRefresh from 'components/ButtonRefresh'
import Button from 'components/Button'
import ButtonLink from 'components/ButtonLink'
import 'styles/last-events.css'

const DEFAULT_PAGE = 1
const DEFAULT_PER_PAGE = 8
const DEFAULT_MORE_QTY = 8

/**
 * @param {PropTypes.InferProps<LastEvents.propTypes>} props
 */
function LastEvents({
  page: initialPage = DEFAULT_PAGE,
  perPage: initialPerPage = DEFAULT_PER_PAGE,
  onPageChange =
    /**
     * @param {number} page
     * @param {number} perPage
     */
    (page, perPage) => {},
  showRefresh = false,
  showMore = false,
  moreQty = DEFAULT_MORE_QTY,
  maxPages = 0,
  showPerPage = false,
}) {
  const navigate = useNavigate()
  /**
   * @type {ReturnType<typeof useState<number>>}
   */
  const [page, setPage] = useState(initialPage ?? DEFAULT_PAGE)
  /**
   * @type {ReturnType<typeof useState<number>>}
   */
  const [perPage, setPerPage] = useState(initialPerPage ?? DEFAULT_PER_PAGE)
  /**
   * @type {ReturnType<typeof useState<number>>}
   */
  const [pages, setPages] = useState(0)
  /**
   * @type {ReturnType<typeof useState<number>>}
   */
  const [total, setTotal] = useState(null)
  /**
   * @type {ReturnType<typeof useState<boolean>>}
   */
  const [loading, setLoading] = useState(false)
  /**
   * @type {ReturnType<typeof useState<Array<{ id: number; name: string; image_url: string; cached_ts: number; in_common_count: number }>>>}
   */
  const [cachedEvents, setCachedEvents] = useState([])
  /**
   * @type {ReturnType<typeof useState<Error | null>>}
   */
  const [error, setError] = useState(null)

  useEffect(
    () => {
      if (initialPage != null) {
        setPage(initialPage)
      }
    },
    [initialPage]
  )

  useEffect(
    () => {
      if (initialPerPage != null) {
        setPerPage(initialPerPage)
      }
    },
    [initialPerPage]
  )

  useEffect(
    () => {
      setLoading(true)
      getLastEvents(page, perPage).then(
        (response) => {
          if (response !== null) {
            setPages(response.pages)
            setTotal(response.total)
            setCachedEvents(response.lastEvents)
            setError(null)

            if (response.total === 0 || response.pages === 0) {
              setError(new Error('Empty'))
            }
          }
          setLoading(false)
        },
        (err) => {
          console.error(err)
          setError(new Error('Unavailable', { cause: err }))
          setCachedEvents([])
          setLoading(false)
        }
      )
    },
    [page, perPage]
  )

  const onRefresh = () => {
    setLoading(true)
    return getLastEvents(page, perPage).then(
      (response) => {
        if (response !== null) {
          setPages(response.pages)
          setTotal(response.total)
          setCachedEvents(response.lastEvents)
          setError(null)

          if (response.total === 0 || response.pages === 0) {
            setError(new Error('Empty'))
          }
        }
        setLoading(false)
      },
      (err) => {
        console.error(err)
        setError(new Error('Unavailable', { cause: err }))
        setCachedEvents([])
        setLoading(false)
      }
    )
  }

  return (
    <div className="last-events">
      <Card>
        <h3>Last Cached Drops</h3>
        {showRefresh && cachedEvents.length > 0 && !loading && page === 1 && (
          <ButtonRefresh onRefresh={onRefresh} />
        )}
        {loading && <Loading />}
        {!loading && showPerPage && (
          <div className="per-page">
            <span className="label">Per page</span>:{' '}
            <ButtonLink
              onClick={() => {
                setPerPage(10)
                if (onPageChange != null) {
                  onPageChange(1, 10)
                }
              }}
              disabled={perPage === 10}
            >
              10
            </ButtonLink>
            <span className="divisor">&mdash;</span>
            <ButtonLink
              onClick={() => {
                setPerPage(10)
                if (onPageChange != null) {
                  onPageChange(1, 100)
                }
              }}
              disabled={perPage === 100}
            >
              100
            </ButtonLink>
          </div>
        )}
        {cachedEvents.length > 0 && !loading && (
          <CachedEventList
            cachedEvents={cachedEvents}
          />
        )}
        {error && !loading &&
          <ErrorMessage away={true} error={error} />
        }
        {pages > 1 && !loading && (
          <Pagination
            page={page}
            pages={
              maxPages != null &&
              maxPages > 0 &&
              maxPages < pages
                ? maxPages
                : pages
            }
            total={total}
            onPage={(newPage) => {
              setPage(newPage)
              if (onPageChange != null) {
                onPageChange(newPage, perPage)
              }
            }}
          >
            {maxPages != null && maxPages > 0 && showMore && (
              <Button
                onClick={() => {
                  navigate(`/last?page=${Math.trunc(page * perPage / moreQty + 1)}&qty=${moreQty}`)
                }}
                secondary={true}
              >
                More
              </Button>
            )}
          </Pagination>
        )}
      </Card>
    </div>
  )
}

LastEvents.propTypes = {
  page: PropTypes.number.isRequired,
  perPage: PropTypes.number,
  onPageChange: PropTypes.func,
  showRefresh: PropTypes.bool,
  showMore: PropTypes.bool,
  moreQty: PropTypes.number,
  maxPages: PropTypes.number,
  showPerPage: PropTypes.bool,
}

export default LastEvents
