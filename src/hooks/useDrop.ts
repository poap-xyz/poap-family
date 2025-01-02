import { useCallback, useState } from 'react'
import { AbortedError } from 'models/error'
import { Drop } from 'models/drop'
import { fetchDrop as loadDrop } from 'services/drops'

function useDrop(dropId?: number): {
  loading: boolean
  error: Error | null
  drop: Drop | null
  fetchDrop: (dropId?: number | null) => () => void
  retryDrop: () => void
} {
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<Error | null>(null)
  const [drop, setDrop] = useState<Drop | null>(null)

  const fetchDrop = useCallback(
    (newDropId: number | null) => {
      let controller: AbortController | undefined
      if (dropId == null && newDropId == null) {
        setError(new Error('No drop to fetch'))
      } else {
        controller = new AbortController()
        setLoading(true)
        setError(null)
        setDrop(null)
        loadDrop(
          newDropId ?? dropId,
          /*includeDescription*/false,
          controller.signal
        ).then(
          (result) => {
            setLoading(false)
            if (result) {
              setDrop(result)
            } else {
              setError(new Error(`Drop ${newDropId ?? dropId} not found`))
            }
          },
          (err: unknown) => {
            setLoading(false)
            if (!(err instanceof AbortedError)) {
              console.error(err)
              if (err instanceof Error) {
                setError(err)
              } else {
                setError(new Error(
                  `Drop ${newDropId ?? dropId} could not be fetched`,
                  { cause: err }
                ))
              }
            }
          }
        )
      }
      return () => {
        if (controller) {
          controller.abort()
        }
        setLoading(false)
        setError(null)
        setDrop(null)
      }
    },
    [dropId]
  )

  function retryDrop(): void {
    setError(null)
  }

  return {
    loading,
    error,
    drop,
    fetchDrop,
    retryDrop,
  }
}

export default useDrop
