import { useCallback, useState } from 'react'
import { AbortedError } from 'models/error'
import { fetchDropsCollections } from 'services/collections'

function useEventsCollections(dropIds: number[]): {
  loadingCollections: boolean
  collectionsError: Error | null
  collections: Awaited<ReturnType<typeof fetchDropsCollections>>['collections'] | null
  relatedCollections: Awaited<ReturnType<typeof fetchDropsCollections>>['related'] | null
  fetchEventsCollections: () => () => void
} {
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<Error | null>(null)
  const [result, setResult] = useState<Awaited<ReturnType<typeof fetchDropsCollections>> | null>(null)

  const fetchEventsCollections = useCallback(
    () => {
      const controller = new AbortController()
      setLoading(true)
      fetchDropsCollections(
        dropIds,
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
      return () => {
        if (controller) {
          controller.abort()
        }
        setLoading(false)
        setError(null)
        setResult(null)
      }
    },
    [dropIds]
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
