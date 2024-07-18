import { useCallback, useState } from 'react'
import { fetchEvent as loadEvent } from 'loaders/event'
import { AbortedError } from 'models/error'
import { Drop } from 'models/drop'

function useEvent(eventId?: number): {
  loadingEvent: boolean
  eventError: Error | null
  event: Drop | null
  fetchEvent: (eventId?: number | null) => () => void
  retryEvent: () => void
} {
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<Error | null>(null)
  const [event, setEvent] = useState<Drop | null>(null)

  const fetchEvent = useCallback(
    (newEventId: number | null) => {
      let controller: AbortController | undefined
      if (eventId == null && newEventId == null) {
        setError(new Error('No drop to fetch'))
      } else {
        controller = new AbortController()
        setLoading(true)
        setError(null)
        setEvent(null)
        loadEvent(
          newEventId ?? eventId,
          /*includeDescription*/false,
          controller.signal
        ).then(
          (result) => {
            setLoading(false)
            if (result) {
              setEvent(result)
            } else {
              setError(new Error(`Drop ${newEventId ?? eventId} not found`))
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
                  `Drop ${newEventId ?? eventId} could not be fetched`,
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
        setEvent(null)
      }
    },
    [eventId]
  )

  function retryEvent(): void {
    setError(null)
  }

  return {
    loadingEvent: loading,
    eventError: error,
    event,
    fetchEvent,
    retryEvent,
  }
}

export default useEvent
