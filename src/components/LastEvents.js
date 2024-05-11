import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getLastEvents } from '../loaders/api'
import CachedEventList from './CachedEventList'
import Card from './Card'
import Loading from './Loading'
import ErrorMessage from './ErrorMessage'
import Pagination from './Pagination'
import ButtonRefresh from './ButtonRefresh'
import Button from './Button'
import ButtonLink from './ButtonLink'
import '../styles/last-events.css'

const DEFAULT_PAGE = 1
const DEFAULT_PER_PAGE = 8
const DEFAULT_MORE_QTY = 8

function LastEvents({
  page: initialPage = DEFAULT_PAGE,
  perPage: initialPerPage = DEFAULT_PER_PAGE,
  onPageChange = (page, perPage) => {},
  showRefresh = false,
  showMore = false,
  maxPages = 0,
  moreQty = DEFAULT_MORE_QTY,
  showPerPage = false,
}) {
  const navigate = useNavigate()
  const [page, setPage] = useState(initialPage)
  const [perPage, setPerPage] = useState(initialPerPage)
  const [pages, setPages] = useState(0)
  const [total, setTotal] = useState(null)
  const [loading, setLoading] = useState(false)
  const [cachedEvents, setCachedEvents] = useState([])
  const [error, setError] = useState(null)

  useEffect(
    () => {
      setPage(initialPage)
    },
    [initialPage]
  )

  useEffect(
    () => {
      setPerPage(initialPerPage)
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
          const error = new Error('Unavailable')
          error.reason = err
          console.error(err)
          setError(error)
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
        const error = new Error('Unavailable')
        error.reason = err
        console.error(err)
        setError(error)
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
                onPageChange(1, 10)
              }}
              disabled={perPage === 10}
            >
              10
            </ButtonLink>
            <span className="divisor">&mdash;</span>
            <ButtonLink
              onClick={() => {
                setPerPage(10)
                onPageChange(1, 100)
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
            showClear={false}
          />
        )}
        {error && !loading &&
          <ErrorMessage style={{ marginTop: '1rem' }}>
            <span title={error.reason ? `${error.reason}` : undefined}>
              {error.message ?? 'Unknown error'}
            </span>
          </ErrorMessage>
        }
        {pages > 1 && !loading && (
          <Pagination
            page={page}
            pages={maxPages > 0 && maxPages < pages ? maxPages : pages}
            total={total}
            onPage={(newPage) => {
              setPage(newPage)
              onPageChange(newPage)
            }}
          >
            {maxPages > 0 && showMore && (
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

export default LastEvents
