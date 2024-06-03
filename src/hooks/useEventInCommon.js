import { useCallback, useEffect, useState } from 'react'
import { AbortedError } from 'models/error'
import { filterInCommon } from 'models/in-common'
import { getInCommonEventsWithProgress, putEventInCommon } from 'loaders/api'
import { scanAddress } from 'loaders/poap'

/**
 * @param {number} eventId
 * @param {string[]} owners
 * @param {boolean} [force]
 * @returns {{
 *   completedEventInCommon: boolean
 *   loadingEventInCommon: boolean
 *   loadedInCommonProgress: { progress: number; estimated: number | null; rate: number | null; } | null
 *   loadedOwners: number
 *   ownersErrors: Array<{ address: string; error: Error }>
 *   inCommon: Record<number, string[]>
 *   events: Record<number, { id: number; name: string; description?: string; image_url: string; original_url: string; city: string | null; country: string | null; start_date: string; end_date: string; expiry_date: string }>
 *   cachedTs: number | null
 *   caching: boolean
 *   cachingError: Error | null
 *   fetchEventInCommon: () => () => void
 *   retryAddress: (address: string) => void
 * }}
 */
function useEventInCommon(eventId, owners, force = false) {
  /**
   * @type {ReturnType<typeof useState<boolean>>}
   */
  const [completed, setCompleted] = useState(false)
  /**
   * @type {ReturnType<typeof useState<boolean>>}
   */
  const [loading, setLoading] = useState(false)
  /**
   * @type {ReturnType<typeof useState<{ progress: number; estimated: number | null; rate: number | null; } | null>>}
   */
  const [loadedProgress, setLoadedProgress] = useState(null)
  /**
   * @type {ReturnType<typeof useState<number>>}
   */
  const [loadedOwners, setLoadedOwners] = useState(0)
  /**
   * @type {ReturnType<typeof useState<Array<{ address: string; error: Error }>>>}
   */
  const [errors, setErrors] = useState([])
  /**
   * @type {ReturnType<typeof useState<Record<number, string[]>>>}
   */
  const [inCommon, setInCommon] = useState({})
  /**
   * @type {ReturnType<typeof useState<Record<number, { id: number; name: string; description?: string; image_url: string; original_url: string; city: string | null; country: string | null; start_date: string; end_date: string; expiry_date: string }>>>}
   */
  const [events, setEvents] = useState({})
  /**
   * @type {ReturnType<typeof useState<number | null>>}
   */
  const [cachedTs, setCachedTs] = useState(null)
  /**
   * @type {ReturnType<typeof useState<boolean>>}
   */
  const [caching, setCaching] = useState(false)
  /**
   * @type {ReturnType<typeof useState<Error | null>>}
   */
  const [cachingError, setCachingError] = useState(null)

  useEffect(
    () => {
      if (loadedOwners === owners.length && !cachedTs) {
        const inCommonProcessed = filterInCommon(inCommon)

        if (Object.keys(inCommonProcessed).length > 0) {
          setCaching(true)
          setCachingError(null)
          putEventInCommon(eventId, inCommonProcessed).then(
            () => {
              setCaching(false)
              setCachedTs(Math.trunc(Date.now() / 1000))
            },
            (err) => {
              console.error(err)
              setCaching(false)
              setCachingError(new Error(
                'Could not cache drop',
                { cause: err }
              ))
            }
          )
        }
      }
    },
    [eventId, owners, loadedOwners, cachedTs, inCommon]
  )

  /**
   * @param {string} address
   * @param {unknown} err
   */
  const addError = (address, err) => {
    if (err instanceof AbortedError) {
      return
    }
    const error = err instanceof Error ? err : new Error(
      'Cannot fetch address in common drops',
      { cause: err }
    )
    setErrors((prevErrors) => [...prevErrors, { address, error }])
  }

  const fetchAddressInCommon = useCallback(
    /**
     * @param {string} address
     * @param {AbortSignal} abortSignal
     */
    async (address, abortSignal) => {
      /**
       * @type {Awaited<ReturnType<typeof scanAddress>>}
       */
      let tokens
      try {
        tokens = await scanAddress(address, abortSignal)
      } catch (err) {
        addError(address, err)
        return
      }
      for (const token of tokens) {
        const event = token.event
        if (event != null) {
          const eventId = event.id
          setInCommon((prevInCommon) => {
            if (prevInCommon == null) {
              return {
                [eventId]: [address],
              }
            }
            if (eventId in prevInCommon) {
              if (!prevInCommon[eventId].includes(address)) {
                prevInCommon[eventId].push(address)
              }
            } else {
              prevInCommon[eventId] = [address]
            }
            return prevInCommon
          })
          setEvents((prevEvents) => ({ ...prevEvents, [eventId]: event }))
        } else {
          const error = new Error(`Could not find POAP ${token.id}`)
          addError(address, error)
          return
        }
      }
      setLoadedOwners((prevLoadedCount) => prevLoadedCount + 1)
    },
    []
  )

  const fetchOwnersInCommon = useCallback(
    /**
     * @param {Record<string, AbortController>} controllers
     */
    async (controllers) => {
      setLoading(true)
      setLoadedOwners(0)
      setErrors([])
      let promise = new Promise((r) => { r(undefined) })
      for (const owner of owners) {
        promise = promise.then(
          () => fetchAddressInCommon(owner, controllers[owner].signal)
        )
      }
      await promise
      setLoading(false)
    },
    [owners, fetchAddressInCommon]
  )

  const fetchEventInCommon = useCallback(
    () => {
      /**
       * @type {Record<string, AbortController>}
       */
      const controllers = owners.reduce(
        (ctrls, owner) => ({ ...ctrls, [owner]: new AbortController() }),
        {}
      )
      setCompleted(false)
      if (force) {
        fetchOwnersInCommon(controllers).finally(() => {
          setCompleted(true)
        })
      } else {
        setLoading(true)
        setLoadedOwners(0)
        setLoadedProgress(null)
        getInCommonEventsWithProgress(
          eventId,
          /*abortSignal*/undefined,
          /*onProgress*/({ progress, estimated, rate }) => {
            if (progress != null) {
              setLoadedProgress({
                progress,
                estimated: estimated ?? null,
                rate: rate ?? null,
              })
            } else {
              setLoadedProgress(null)
            }
          }
        ).then(
          (result) => {
            setLoadedProgress(null)
            if (!result) {
              return fetchOwnersInCommon(controllers)
            }
            setLoading(false)
            if (eventId in result.inCommon) {
              setLoadedOwners(result.inCommon[eventId].length)
            }
            setInCommon(result.inCommon)
            setEvents(result.events)
            setCachedTs(result.ts)
          },
          (err) => {
            setLoadedProgress(null)
            console.error(err)
            return fetchOwnersInCommon(controllers)
          }
        ).finally(() => {
          setCompleted(true)
        })
      }
      return () => {
        for (const controller of Object.values(controllers)) {
          controller.abort()
        }
        setCompleted(false)
        setLoading(false)
        setLoadedProgress(null)
        setLoadedOwners(0)
        setErrors([])
        setInCommon({})
      }
    },
    [eventId, owners, force, fetchOwnersInCommon]
  )

  /**
   * @param {string} address
   */
  const retryAddress = (address) => {
    setErrors((prevErrors) => {
      if (prevErrors == null) {
        return []
      }
      const newErrors = []
      for (const { error, address: errorAddress } of prevErrors) {
        if (errorAddress !== address) {
          newErrors.push({ error, address: errorAddress })
        }
      }
      return newErrors
    })
    const controller = new AbortController()
    fetchAddressInCommon(address, controller.signal)
    return () => {
      controller.abort()
    }
  }

  return {
    completedEventInCommon: completed,
    loadingEventInCommon: loading,
    loadedInCommonProgress: loadedProgress,
    loadedOwners,
    ownersErrors: errors,
    inCommon,
    events,
    cachedTs,
    caching,
    cachingError,
    fetchEventInCommon,
    retryAddress,
  }
}

export default useEventInCommon
