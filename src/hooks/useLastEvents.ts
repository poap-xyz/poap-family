import { useCallback, useState } from 'react'
import { getLastEvents } from 'services/api'
import { CachedEvent } from 'models/api'

function useLastEvents(page: number, perPage: number): {
  loading: boolean
  error: Error | null
  pages: number
  total: number
  lastEvents: CachedEvent[]
  fetchLastEvents: () => void
} {
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<Error | null>(null)
  const [pages, setPages] = useState<number>(0)
  const [total, setTotal] = useState<number>(null)
  const [lastEvents, setLastEvents] = useState<CachedEvent[]>([])
  
  const fetchLastEvents = useCallback(
    () => {
      setLoading(true)
      getLastEvents(page, perPage).then(
        (response) => {
          if (response !== null) {
            setPages(response.pages)
            setTotal(response.total)
            setLastEvents(response.lastEvents)
            setError(null)

            if (response.total === 0 || response.pages === 0) {
              setError(new Error('Empty'))
            }
          }
          setLoading(false)
        },
        (err) => {
          console.error(err)
          setError(new Error('Unavailable', { cause: err }))
          setLastEvents([])
          setLoading(false)
        }
      )
    },
    [page, perPage]
  )

  return {
    loading,
    error,
    pages,
    total,
    lastEvents,
    fetchLastEvents,
  }
}

export default useLastEvents
