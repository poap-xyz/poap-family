import { useCallback, useState } from 'react'
import { AbortedError } from 'models/error'
import { useSettings } from 'stores/settings'
import { findEventsCollections } from 'loaders/collection'

/**
 * @param {number[]} eventIds
 * @returns {{
 *   loadingCollections: boolean
 *   collectionsError: Error | null
 *   collections: Awaited<ReturnType<typeof findEventsCollections>>['collections'] | null
 *   relatedCollections: Awaited<ReturnType<typeof findEventsCollections>>['related'] | null
 *   fetchEventsCollections: () => () => void
 * }}
 */
function useEventsCollections(eventIds) {
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
   * @type {ReturnType<typeof useState<Awaited<ReturnType<typeof findEventsCollections>> | null>>}
   */
  const [result, setResult] = useState(null)

  const fetchEventsCollections = useCallback(
    () => {
      /**
       * @type {AbortController | undefined}
       */
      let controller
      if (settings.showCollections) {
        controller = new AbortController()
        setLoading(true)
        findEventsCollections(
          eventIds,
          controller.signal
        ).then((result) => {
          setResult(result)
          setLoading(false)
        }).catch((err) => {
          setLoading(false)
          if (!(err instanceof AbortedError)) {
            console.error(err)
            if (err instanceof Error) {
              setError(err)
            } else {
              setError(new Error(`Could not load collections`, { cause: err }))
            }
          }
        })
      }
      return () => {
        if (controller) {
          controller.abort()
        }
        setLoading(false)
        setError(null)
        setResult(null)
      }
    },
    [eventIds, settings.showCollections]
  )

  return {
    loadingCollections: loading,
    collectionsError: error,
    collections: result == null ? null : result.collections,
    relatedCollections: result == null ? null : result.related,
    fetchEventsCollections,
  }
}

export default useEventsCollections
