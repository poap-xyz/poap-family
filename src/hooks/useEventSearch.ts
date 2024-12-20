import { useCallback, useState } from 'react'
import { SEARCH_LIMIT, Drop } from 'models/drop'
import { AbortedError } from 'models/error'
import { searchDrops } from 'loaders/drop'

function useEventSearch(query?: string, page: number = 1): {
  loadingEventSearch: boolean
  eventSearchError: Error | null
  totalEventResults: number | null
  resultEvents: Drop[]
  searchEvents: (newQuery?: string | null, newPage?: number) => () => void
  retryEventSearch: () => void
} {
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<Error | null>(null)
  const [total, setTotal] = useState<number | null>(null)
  const [resultEvents, setResultEvents] = useState<Drop[]>([])

  const searchEvents = useCallback(
    (newQuery: string, newPage: number) => {
      let controller: AbortController | undefined
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
          searchDrops(
            newQuery ?? query,
            controller.signal,
            offset,
            SEARCH_LIMIT
          ).then(
            (results) => {
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
    [page, query, total]
  )

  function retryEventSearch(): void {
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
