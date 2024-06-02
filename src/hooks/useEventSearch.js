import { useEffect, useState } from 'react'
import { useAnalytics } from 'stores/analytics'
import { SEARCH_LIMIT } from 'models/event'
import { AbortedError } from 'models/error'
import { searchEvents as loadSearchEvents } from 'loaders/event'

/**
 * @param {string | null} [initialQuery]
 * @param {number} [initialPage]
 * @returns {{
 *   loadingEventSearch: boolean
 *   eventSearchError: Error | null
 *   query: string | null
 *   page: number
 *   totalEventResults: number | null
 *   resultEvents: Array<{ id: number; name: string; description?: string; image_url: string; original_url: string; city: string | null; country: string | null; start_date: string; end_date: string; expiry_date: string }>
 *   searchEvents: (newQuery?: string | null, newPage?: number) => void
 *   cancelEventSearch: () => void
 *   retryEventSearch: () => void
 * }}
 */
function useEventSearch(initialQuery, initialPage) {
  const { trackSiteSearch } = useAnalytics()
  /**
   * @type {ReturnType<typeof useState<boolean>>}
   */
  const [loading, setLoading] = useState(false)
  /**
   * @type {ReturnType<typeof useState<AbortController | null>>}
   */
  const [controller, setController] = useState(null)
  /**
   * @type {ReturnType<typeof useState<Error | null>>}
   */
  const [error, setError] = useState(null)
  /**
   * @type {ReturnType<typeof useState<string | null>>}
   */
  const [query, setQuery] = useState(null)
  /**
   * @type {ReturnType<typeof useState<number>>}
   */
  const [page, setPage] = useState(1)
  /**
   * @type {ReturnType<typeof useState<number | null>>}
   */
  const [total, setTotal] = useState(null)
  /**
   * @type {ReturnType<typeof useState<Array<{ id: number; name: string; description?: string; image_url: string; original_url: string; city: string | null; country: string | null; start_date: string; end_date: string; expiry_date: string }>>>}
   */
  const [resultEvents, setResultEvents] = useState([])

  useEffect(
    () => {
      setQuery(initialQuery)
    },
    [initialQuery]
  )

  useEffect(
    () => {
      setPage(initialPage ?? 1)
    },
    [initialPage]
  )

  /**
   * @param {string | null} [newQuery]
   * @param {number} [newPage]
   */
  const searchEvents = (newQuery, newPage) => {
    if (query == null && newQuery == null) {
      setError(new Error('No query to search drops'))
    } else {
      if (newQuery != null) {
        setQuery(newQuery)
      }
      if (newPage) {
        setPage(newPage)
      }
      setError(null)
      setTotal(null)
      setResultEvents([])
      const offset = ((newPage ?? page) - 1) * SEARCH_LIMIT
      if (total == null || offset <= total) {
        const controller = new AbortController()
        setLoading(true)
        setController(controller)
        loadSearchEvents(
          newQuery ?? query,
          controller.signal,
          offset,
          SEARCH_LIMIT
        ).then(
          (results) => {
            if ((newPage ?? page) === 1) {
              trackSiteSearch({
                category: 'drops',
                keyword: newQuery ?? query,
                count: results.total,
              })
            }
            setLoading(false)
            setController(null)
            setTotal(results.total)
            setResultEvents(results.items)
            if (results.total === 0 || results.items.length === 0) {
              setError(new Error('No drops results for query'))
            }
          },
          (err) => {
            setLoading(false)
            setController(null)
            if (!(err instanceof AbortedError)) {
              console.error(err)
              if (err instanceof Error) {
                setError(err)
              } else {
                setError(new Error(
                  `Cannot search drops for "${query}"`,
                  { cause: err }
                ))
              }
            }
          }
        )
      }
    }
  }

  const cancelEventSearch = () => {
    if (controller) {
      controller.abort()
    }
    setLoading(false)
    setController(null)
    setError(null)
    setTotal(null)
    setResultEvents([])
  }

  const retryEventSearch = () => {
    setError(null)
  }

  return {
    loadingEventSearch: loading,
    eventSearchError: error,
    query,
    page,
    totalEventResults: total,
    resultEvents,
    searchEvents,
    cancelEventSearch,
    retryEventSearch,
  }
}

export default useEventSearch
