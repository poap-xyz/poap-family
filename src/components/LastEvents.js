import { useEffect, useState } from 'react'
import { getLastEvents } from '../loaders/api'
import CachedEventList from './CachedEventList'
import Card from './Card'
import Loading from './Loading'
import ErrorMessage from './ErrorMessage'
import Pagination from './Pagination'
import ButtonRefresh from './ButtonRefresh'
import '../styles/last-events.css'

function LastEvents({ currentPage = 1, onPageChange = (page) => {}, qty = 3, showRefresh = false }) {
  const [page, setPage] = useState(currentPage)
  const [pages, setPages] = useState(0)
  const [total, setTotal] = useState(null)
  const [loading, setLoading] = useState(false)
  const [cachedEvents, setCachedEvents] = useState([])
  const [error, setError] = useState(null)

  useEffect(
    () => {
      setPage(currentPage)
    },
    [currentPage]
  )

  useEffect(
    () => {
      setLoading(true)
      getLastEvents(page, qty).then(
        (response) => {
          if (response !== null) {
            setPages(response.pages)
            setTotal(response.total)
            setCachedEvents(response.lastEvents)

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
          setLoading(false)
        }
      )
    },
    [page, qty]
  )

  return (
    <div className="last-events">
      <Card>
        <h3>Last Cached Drops</h3>
        {showRefresh && cachedEvents.length > 0 && !loading && page === 1 && (
          <ButtonRefresh
            onRefresh={() => {
              setLoading(true)
              return getLastEvents(page, qty).then(
                (response) => {
                  if (response !== null) {
                    setPages(response.pages)
                    setTotal(response.total)
                    setCachedEvents(response.lastEvents)

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
                  setLoading(false)
                }
              )
            }}
          />
        )}
        {loading && <Loading />}
        {cachedEvents.length > 0 && !loading && <CachedEventList
          cachedEvents={cachedEvents}
          showClear={false}
        />}
        {error &&
          <ErrorMessage style={{ marginTop: '1rem' }}>
            <span title={error.reason ? `${error.reason}` : undefined}>
              {error.message ?? 'Unknown error'}
            </span>
          </ErrorMessage>
        }
        {pages > 1 && !loading && <Pagination
          page={page}
          pages={pages}
          total={total}
          onPage={(newPage) => {
            setPage(newPage)
            onPageChange(newPage)
          }}
        />}
      </Card>
    </div>
  )
}

export default LastEvents
