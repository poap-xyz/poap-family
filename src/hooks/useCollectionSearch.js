import { useCallback, useState } from 'react'
import { useSettings } from 'stores/settings'
import { SEARCH_LIMIT } from 'models/event'
import { searchCollections as loadSearchCollections } from 'loaders/collection'
import { AbortedError } from 'models/error'

/**
 * @param {string} [query]
 * @param {number} [page]
 * @returns {{
 *   loadingCollectionSearch: boolean
 *   collectionSearchError: Error | null
 *   totalCollectionResults: number | null
 *   resultCollections: Array<{ id: number; slug: string; title: string | null; banner_image_url: string | null; logo_image_url: string | null; dropIds: number[] }>
 *   searchCollections: (newQuery?: string | null, newPage?: number) => () => void
 *   retryCollectionSearch: () => void
 * }}
 */
function useCollectionSearch(query, page) {
  const { settings } = useSettings()
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
   * @type {ReturnType<typeof useState<Array<{ id: number; slug: string; title: string | null; banner_image_url: string | null; logo_image_url: string | null; dropIds: number[] }>>>}
   */
  const [resultCollections, setResultCollections] = useState([])

  const searchCollections = useCallback(
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

  const retryCollectionSearch = () => {
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
