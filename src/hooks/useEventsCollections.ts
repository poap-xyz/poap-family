import { useCallback, useState } from 'react'
import { AbortedError } from 'models/error'
import { useSettings } from 'stores/settings'
import { findEventsCollections } from 'loaders/collection'

function useEventsCollections(eventIds: number[]): {
  loadingCollections: boolean
  collectionsError: Error | null
  collections: Awaited<ReturnType<typeof findEventsCollections>>['collections'] | null
  relatedCollections: Awaited<ReturnType<typeof findEventsCollections>>['related'] | null
  fetchEventsCollections: () => () => void
} {
  const { settings } = useSettings()
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<Error | null>(null)
  const [result, setResult] = useState<Awaited<ReturnType<typeof findEventsCollections>> | null>(null)

  const fetchEventsCollections = useCallback(
    () => {
      let controller: AbortController | undefined
      if (settings.showCollections) {
        controller = new AbortController()
        setLoading(true)
        findEventsCollections(
          eventIds,
          controller.signal
        ).then((result) => {
          setResult(result)
          setLoading(false)
        }).catch((err: unknown) => {
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
