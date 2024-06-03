import { useCallback, useState } from 'react'
import { useAnalytics } from 'stores/analytics'
import { SEARCH_LIMIT } from 'models/event'
import { AbortedError } from 'models/error'
import { searchEvents as loadSearchEvents } from 'loaders/event'

/**
 * @param {string} [query]
 * @param {number} [page]
 * @returns {{
 *   loadingEventSearch: boolean
 *   eventSearchError: Error | null
 *   totalEventResults: number | null
 *   resultEvents: Array<{ id: number; name: string; description?: string; image_url: string; original_url: string; city: string | null; country: string | null; start_date: string; end_date: string; expiry_date: string }>
 *   searchEvents: (newQuery?: string | null, newPage?: number) => () => void
 *   retryEventSearch: () => void
 * }}
 */
function useEventSearch(query, page) {
  const { trackSiteSearch } = useAnalytics()
  /**
   * @type {ReturnType<typeof useState<boolean>>}
   */
  const [loading, setLoading] = useState(false)
  /**
   * @type {ReturnType<typeof useState<Error | null>>}
   */
  const [error, setError] = useState(null)
  /**
   * @type {ReturnType<typeof useState<number | null>>}
   */
  const [total, setTotal] = useState(null)
  /**
   * @type {ReturnType<typeof useState<Array<{ id: number; name: string; description?: string; image_url: string; original_url: string; city: string | null; country: string | null; start_date: string; end_date: string; expiry_date: string }>>>}
   */
  const [resultEvents, setResultEvents] = useState([])

  const searchEvents = useCallback(
    /**
     * @param {string} [newQuery]
     * @param {number} [newPage]
     */
    (newQuery, newPage) => {
      /**
       * @type {AbortController | undefined}
       */
      let controller
      if (query == null && newQuery == null) {
        setError(new Error('No query to search drops'))
      } else {
        setError(null)
        setTotal(null)
        setResultEvents([])
        const offset = ((newPage ?? page) - 1) * SEARCH_LIMIT
        if (total == null || offset <= total) {
          controller = new AbortController()
          setLoading(true)
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
              setTotal(results.total)
              setResultEvents(results.items)
              if (results.total === 0 || results.items.length === 0) {
                setError(new Error('No drops results for query'))
              }
            },
            (err) => {
              setLoading(false)
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
      return () => {
        if (controller) {
          controller.abort()
        }
        setLoading(false)
        setError(null)
        setTotal(null)
        setResultEvents([])
      }
    },
    [page, query, total, trackSiteSearch]
  )

  const retryEventSearch = () => {
    setError(null)
  }

  return {
    loadingEventSearch: loading,
    eventSearchError: error,
    totalEventResults: total,
    resultEvents,
    searchEvents,
    retryEventSearch,
  }
}

export default useEventSearch
