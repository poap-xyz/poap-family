import { useEffect, useState } from 'react'
import { fetchEvent } from 'loaders/event'
import { AbortedError } from 'models/error'

/**
 * @param {number | null} [initialEventId]
 * @returns {{
 *   loading: boolean
 *   error: Error | null
 *   eventId: number | null
 *   event: { id: number; name: string; description?: string; image_url: string; original_url: string; city: string | null; country: string | null; start_date: string; end_date: string; expiry_date: string } | null
 *   findEvent: (eventId: number | null) => void
 *   cancelEvent: () => void
 *   retryEvent: () => void
 * }}
 */
function useEvent(initialEventId) {
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
   * @type {ReturnType<typeof useState<number | null>>}
   */
  const [eventId, setEventId] = useState(null)
  /**
   * @type {ReturnType<typeof useState<{ id: number; name: string; description?: string; image_url: string; original_url: string; city: string | null; country: string | null; start_date: string; end_date: string; expiry_date: string } | null>>}
   */
  const [event, setEvent] = useState(null)

  useEffect(
    () => {
      setEventId(initialEventId)
    },
    [initialEventId]
  )

  /**
   * @param {number | null} [newEventId]
   */
  const findEvent = (newEventId) => {
    if (eventId == null && newEventId == null) {
      setError(new Error('No Drop to fetch'))
    } else {
      const controller = new AbortController()
      if (newEventId != null) {
        setEventId(newEventId)
      }
      setLoading(true)
      setController(controller)
      setError(null)
      setEvent(null)
      fetchEvent(
        newEventId ?? eventId,
        /*includeDescription*/false,
        controller.signal
      ).then(
        (result) => {
          setLoading(false)
          setController(null)
          if (result) {
            setEvent(result)
          } else {
            setError(new Error(`Drop ${eventId} not found`))
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
                `Drop ${eventId} could not be fetched`,
                { cause: err }
              ))
            }
          }
        }
      )
    }
  }

  const cancelEvent = () => {
    if (controller) {
      controller.abort()
    }
    setLoading(false)
    setController(null)
    setError(null)
    setEvent(null)
  }

  const retryEvent = () => {
    setError(null)
  }

  return {
    loading,
    error,
    eventId,
    event,
    findEvent,
    cancelEvent,
    retryEvent,
  }
}

export default useEvent