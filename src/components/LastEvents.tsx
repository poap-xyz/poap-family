import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import useLastEvents from 'hooks/useLastEvents'
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

function LastEvents({
  page: initialPage = DEFAULT_PAGE,
  perPage: initialPerPage = DEFAULT_PER_PAGE,
  onPageChange,
  showRefresh = false,
  showMore = false,
  moreQty = DEFAULT_MORE_QTY,
  maxPages = 0,
  showPerPage = false,
}: {
  page?: number
  perPage?: number
  onPageChange?: (page: number, perPage: number) => void
  showRefresh?: boolean
  showMore?: boolean
  moreQty?: number
  maxPages?: number
  showPerPage?: boolean
}) {
  const navigate = useNavigate()
  const [page, setPage] = useState<number>(initialPage ?? DEFAULT_PAGE)
  const [perPage, setPerPage] = useState<number>(initialPerPage ?? DEFAULT_PER_PAGE)

  const {
    loading,
    error,
    pages,
    total,
    lastEvents,
    fetchLastEvents,
  } = useLastEvents(page, perPage)

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
      fetchLastEvents()
    },
    [fetchLastEvents]
  )

  function onRefresh(): void {
    fetchLastEvents()
  }

  return (
    <div className="last-events">
      <Card>
        <h3>Last Cached Drops</h3>
        {showRefresh && lastEvents.length > 0 && !loading && page === 1 && (
          <ButtonRefresh onRefresh={onRefresh} />
        )}
        {loading && <Loading size="big" />}
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
        {lastEvents.length > 0 && !loading && (
          <CachedEventList
            cachedEvents={lastEvents}
          />
        )}
        {lastEvents.length === 0 && !error && !loading && (
          <ErrorMessage>
            No cached drops
          </ErrorMessage>
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

export default LastEvents
