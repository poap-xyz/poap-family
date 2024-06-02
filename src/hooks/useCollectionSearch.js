import { useEffect, useState } from 'react'
import { useAnalytics } from 'stores/analytics'
import { useSettings } from 'stores/settings'
import { SEARCH_LIMIT } from 'models/event'
import { searchCollections as loadSearchCollections } from 'loaders/collection'
import { AbortedError } from 'models/error'

/**
 * @param {string | null} [initialQuery]
 * @param {number} [initialPage]
 * @returns {{
 *   loadingCollectionSearch: boolean
 *   collectionSearchError: Error | null
 *   query: string | null
 *   page: number
 *   totalCollectionResults: number | null
 *   resultCollections: Array<{ id: number; slug: string; title: string | null; banner_image_url: string | null; logo_image_url: string | null; dropIds: number[] }>
 *   searchCollections: (newQuery?: string | null, newPage?: number) => void
 *   cancelCollectionSearch: () => void
 *   retryCollectionSearch: () => void
 * }}
 */
function useCollectionSearch(initialQuery, initialPage) {
  const { trackSiteSearch } = useAnalytics()
  const { settings } = useSettings()
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
   * @type {ReturnType<typeof useState<Array<{ id: number; slug: string; title: string | null; banner_image_url: string | null; logo_image_url: string | null; dropIds: number[] }>>>}
   */
  const [resultCollections, setResultCollections] = useState([])

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
  const searchCollections = (newQuery, newPage) => {
    if (query == null && newQuery == null) {
      setError(new Error('No query to search collections'))
    } else {
      if (newQuery != null) {
        setQuery(newQuery)
      }
      if (newPage) {
        setPage(newPage)
      }
      setError(null)
      setTotal(null)
      setResultCollections([])
      const offset = ((newPage ?? page) - 1) * SEARCH_LIMIT
      if (settings.showCollections && (total == null || offset <= total)) {
        const controller = new AbortController()
        setLoading(true)
        setController(controller)
        loadSearchCollections(
          newQuery ?? query,
          controller.signal,
          offset,
          SEARCH_LIMIT
        ).then(
          (results) => {
            if ((newPage ?? page) === 1) {
              trackSiteSearch({
                category: 'collections',
                keyword: newQuery ?? query,
                count: results.total == null ? undefined : results.total,
              })
            }
            setLoading(false)
            setController(null)
            setResultCollections(results.items)
            if (results.total) {
              setTotal(results.total)
            } else {
              setTotal(0)
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
                  `Cannot search collections for "${query}"`,
                  { cause: err }
                ))
              }
            }
          }
        )
      }
    }
  }

  const cancelCollectionSearch = () => {
    if (controller) {
      controller.abort()
    }
    setLoading(false)
    setController(null)
    setError(null)
    setTotal(null)
    setResultCollections([])
  }

  const retryCollectionSearch = () => {
    setError(null)
  }

  return {
    loadingCollectionSearch: loading,
    collectionSearchError: error,
    query,
    page,
    totalCollectionResults: total,
    resultCollections,
    searchCollections,
    cancelCollectionSearch,
    retryCollectionSearch,
  }
}

export default useCollectionSearch
