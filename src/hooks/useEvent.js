import { useCallback, useState } from 'react'
import { fetchEvent as loadEvent } from 'loaders/event'
import { AbortedError } from 'models/error'

/**
 * @param {number | null} [eventId]
 * @returns {{
 *   loadingEvent: boolean
 *   eventError: Error | null
 *   event: { id: number; name: string; description?: string; image_url: string; original_url: string; city: string | null; country: string | null; start_date: string; end_date: string; expiry_date: string } | null
 *   fetchEvent: (eventId?: number | null) => () => void
 *   retryEvent: () => void
 * }}
 */
function useEvent(eventId) {
  /**
   * @type {ReturnType<typeof useState<boolean>>}
   */
  const [loading, setLoading] = useState(false)
  /**
   * @type {ReturnType<typeof useState<Error | null>>}
   */
  const [error, setError] = useState(null)
  /**
   * @type {ReturnType<typeof useState<{ id: number; name: string; description?: string; image_url: string; original_url: string; city: string | null; country: string | null; start_date: string; end_date: string; expiry_date: string } | null>>}
   */
  const [event, setEvent] = useState(null)

  const fetchEvent = useCallback(
    /**
     * @param {number | null} [newEventId]
     */
    (newEventId) => {
      /**
       * @type {AbortController | undefined}
       */
      let controller
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

  const retryEvent = () => {
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
