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
 *   fetchEventsCollections: () => void
 *   cancelEventsCollections: () => void
 * }}
 */
function useEventsCollections(eventIds) {
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
   * @type {ReturnType<typeof useState<Awaited<ReturnType<typeof findEventsCollections>> | null>>}
   */
  const [result, setResult] = useState(null)

  const fetchEventsCollections = useCallback(
    () => {
      if (settings.showCollections) {
        const controller = new AbortController()
        setLoading(true)
        setController(controller)
        findEventsCollections(
          eventIds,
          controller.signal
        ).then((result) => {
          setResult(result)
          setLoading(false)
          setController(null)
        }).catch((err) => {
          setLoading(false)
          setController(null)
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
    },
    [eventIds, settings.showCollections]
  )

  const cancelEventsCollections = useCallback(
    () => {
      if (controller) {
        controller.abort()
      }
      setLoading(false)
      setController(null)
      setError(null)
      setResult(null)
    },
    [controller]
  )

  return {
    loadingCollections: loading,
    collectionsError: error,
    collections: result == null ? null : result.collections,
    relatedCollections: result == null ? null : result.related,
    fetchEventsCollections,
    cancelEventsCollections,
  }
}

export default useEventsCollections
