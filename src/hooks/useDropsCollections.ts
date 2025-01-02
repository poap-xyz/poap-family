import { useCallback, useState } from 'react'
import { AbortedError } from 'models/error'
import { fetchDropsCollections as fetchCollectorsByDrops } from 'services/collections'

function useDropsCollections(dropIds?: number[]): {
  loading: boolean
  error: Error | null
  collections: Awaited<ReturnType<typeof fetchCollectorsByDrops>>['collections'] | null
  relatedCollections: Awaited<ReturnType<typeof fetchCollectorsByDrops>>['related'] | null
  fetchDropsCollections: () => () => void
} {
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<Error | null>(null)
  const [result, setResult] = useState<Awaited<ReturnType<typeof fetchCollectorsByDrops>> | null>(null)

  const fetchDropsCollections = useCallback(
    () => {
      if (dropIds == null) {
        return () => {}
      }
      const controller = new AbortController()
      setLoading(true)
      fetchCollectorsByDrops(
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
    loading,
    error,
    collections: result == null ? null : result.collections,
    relatedCollections: result == null ? null : result.related,
    fetchDropsCollections,
  }
}

export default useDropsCollections
