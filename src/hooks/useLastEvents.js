import { useCallback, useState } from 'react'
import { getLastEvents } from 'loaders/api'

/**
 * @param {number} page
 * @param {number} perPage
 * @returns {{
 *   loading: boolean
 *   error: Error | null
 *   pages: number
 *   total: number
 *   lastEvents: Array<{
 *     id: number
 *     name: string
 *     image_url: string
 *     cached_ts: number
 *     in_common_count: number
 *   }>
 *   fetchLastEvents: () => void
 * }}
 */
function useLastEvents(page, perPage) {
  /**
   * @type {ReturnType<typeof useState<boolean>>}
   */
  const [loading, setLoading] = useState(false)
  /**
   * @type {ReturnType<typeof useState<Error | null>>}
   */
  const [error, setError] = useState(null)
  /**
   * @type {ReturnType<typeof useState<number>>}
   */
  const [pages, setPages] = useState(0)
  /**
   * @type {ReturnType<typeof useState<number>>}
   */
  const [total, setTotal] = useState(null)
  /**
   * @type {ReturnType<typeof useState<Array<{ id: number; name: string; image_url: string; cached_ts: number; in_common_count: number }>>>}
   */
  const [lastEvents, setLastEvents] = useState([])
  
  const fetchLastEvents = useCallback(
    () => {
      setLoading(true)
      getLastEvents(page, perPage).then(
        (response) => {
          if (response !== null) {
            setPages(response.pages)
            setTotal(response.total)
            setLastEvents(response.lastEvents)
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
          setLastEvents([])
          setLoading(false)
        }
      )
    },
    [page, perPage]
  )

  return {
    loading,
    error,
    pages,
    total,
    lastEvents,
    fetchLastEvents,
  }
}

export default useLastEvents
