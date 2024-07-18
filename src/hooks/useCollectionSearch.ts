import { useCallback, useState } from 'react'
import { useSettings } from 'stores/settings'
import { SEARCH_LIMIT } from 'models/event'
import { searchCollections as loadSearchCollections } from 'loaders/collection'
import { AbortedError } from 'models/error'
import { CollectionWithDrops } from 'models/collection'

function useCollectionSearch(query?: string, page: number = 1): {
  loadingCollectionSearch: boolean
  collectionSearchError: Error | null
  totalCollectionResults: number | null
  resultCollections: CollectionWithDrops[]
  searchCollections: (newQuery?: string | null, newPage?: number) => () => void
  retryCollectionSearch: () => void
} {
  const { settings } = useSettings()
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<Error | null>(null)
  const [total, setTotal] = useState<number | null>(null)
  const [resultCollections, setResultCollections] = useState<CollectionWithDrops[]>([])

  const searchCollections = useCallback(
    (newQuery: string, newPage: number) => {
      let controller: AbortController | undefined
      if (query == null && newQuery == null) {
        setError(new Error('No query to search collections'))
      } else {
        setError(null)
        setTotal(null)
        setResultCollections([])
        const offset = ((newPage ?? page) - 1) * SEARCH_LIMIT
        if (settings.showCollections && (total == null || offset <= total)) {
          controller = new AbortController()
          setLoading(true)
          loadSearchCollections(
            newQuery ?? query,
            controller.signal,
            offset,
            SEARCH_LIMIT
          ).then(
            (results) => {
              setLoading(false)
              setResultCollections(results.items)
              if (results.total) {
                setTotal(results.total)
              } else {
                setTotal(0)
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
                    `Cannot search collections for "${query}"`,
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
        setResultCollections([])
      }
    },
    [query, page, total, settings.showCollections]
  )

  function retryCollectionSearch(): void {
    setError(null)
  }

  return {
    loadingCollectionSearch: loading,
    collectionSearchError: error,
    totalCollectionResults: total,
    resultCollections,
    searchCollections,
    retryCollectionSearch,
  }
}

export default useCollectionSearch
