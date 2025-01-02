import { useCallback, useState } from 'react'
import { SEARCH_LIMIT, Drop } from 'models/drop'
import { AbortedError } from 'models/error'
import { searchDrops as queryDrops } from 'services/drops'

function useDropSearch(query?: string, page: number = 1): {
  loading: boolean
  error: Error | null
  total: number | null
  resultDrops: Drop[]
  searchDrops: (newQuery?: string | null, newPage?: number) => () => void
  retryDropSearch: () => void
} {
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<Error | null>(null)
  const [total, setTotal] = useState<number | null>(null)
  const [resultDrops, setResultDrops] = useState<Drop[]>([])

  const searchDrops = useCallback(
    (newQuery: string, newPage: number) => {
      let controller: AbortController | undefined
      if (query == null && newQuery == null) {
        setError(new Error('No query to search drops'))
      } else {
        setError(null)
        setTotal(null)
        setResultDrops([])
        const offset = ((newPage ?? page) - 1) * SEARCH_LIMIT
        if (total == null || offset <= total) {
          controller = new AbortController()
          setLoading(true)
          queryDrops(
            newQuery ?? query,
            controller.signal,
            offset,
            SEARCH_LIMIT
          ).then(
            (results) => {
              setLoading(false)
              setTotal(results.total)
              setResultDrops(results.items)
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
        setResultDrops([])
      }
    },
    [page, query, total]
  )

  function retryDropSearch(): void {
    setError(null)
  }

  return {
    loading,
    error,
    total,
    resultDrops,
    searchDrops,
    retryDropSearch,
  }
}

export default useDropSearch
