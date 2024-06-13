import { useCallback, useEffect, useState } from 'react'
import { getInCommonEventsWithProgress, putEventInCommon } from 'loaders/api'
import { scanAddress } from 'loaders/poap'
import { AbortedError } from 'models/error'
import { filterInCommon } from 'models/in-common'

/**
 * @param {number[]} eventIds
 * @param {Record<number, string[]>} eventsOwners
 * @param {boolean} [all]
 * @param {boolean} [force]
 * @returns {{
 *   completedEventsInCommon: boolean
 *   completedInCommonEvents: Record<number, boolean>
 *   loadingInCommonEvents: Record<number, boolean>
 *   eventsInCommonErrors: Record<number, Record<string, Error>>
 *   loadedEventsProgress: Record<number, { progress: number; estimated: number | null; rate: number | null; }>
 *   loadedEventsOwners: Record<number, number>
 *   eventsInCommon: Record<number, { events: Record<number, { id: number; name: string; description?: string; image_url: string; original_url: string; city: string | null; country: string | null; start_date: string; end_date: string; expiry_date: string }>; inCommon: Record<number, string[]>; ts: number | null }>
 *   cachingEvents: Record<number, boolean>
 *   cachingEventsErrors: Record<number, Error>
 *   fetchEventsInCommon: () => () => void
 *   retryEventAddressInCommon: (eventId: number, address: string) => () => void
 * }}
 */
function useEventsInCommon(eventIds, eventsOwners, all = false, force = false) {
  /**
   * @type {ReturnType<typeof useState<Record<number, boolean>>>}
   */
  const [completed, setCompleted] = useState({})
  /**
   * @type {ReturnType<typeof useState<Record<number, boolean>>>}
   */
  const [loading, setLoading] = useState({})
  /**
   * @type {ReturnType<typeof useState<Record<number, Record<string, Error>>>>}
   */
  const [errors, setErrors] = useState({})
  /**
   * @type {ReturnType<typeof useState<Record<number, { progress: number; estimated: number | null; rate: number | null; }>>>}
   */
  const [loadedProgress, setLoadedProgress] = useState({})
  /**
   * @type {ReturnType<typeof useState<Record<number, number>>>}
   */
  const [loadedOwners, setLoadedOwners] = useState({})
  /**
   * @type {ReturnType<typeof useState<Record<number, { events: Record<number, { id: number; name: string; description?: string; image_url: string; original_url: string; city: string | null; country: string | null; start_date: string; end_date: string; expiry_date: string }>; inCommon: Record<number, string[]>; ts: number | null }>>>}
   */
  const [inCommon, setInCommon] = useState({})
  /**
   * @type {ReturnType<typeof useState<Record<number, boolean>>>}
   */
  const [caching, setCaching] = useState({})
  /**
   * @type {ReturnType<typeof useState<Record<number, Error>>>}
   */
  const [cachingErrors, setCachingErrors] = useState({})

  useEffect(
    () => {
      for (const eventId of eventIds) {
        if (
          completed[eventId] &&
          (loadedOwners[eventId] ?? 0) === eventsOwners[eventId].length &&
          inCommon[eventId] != null &&
          inCommon[eventId].ts == null &&
          !caching[eventId]
        ) {
          const inCommonProcessed = filterInCommon(
            inCommon[eventId].inCommon
          )
          if (Object.keys(inCommonProcessed).length > 0) {
            removeCachingError(eventId)
            addCaching(eventId)
            putEventInCommon(eventId, inCommonProcessed).then(
              () => {
                updateCachedTs(eventId)
                removeCaching(eventId)
              },
              (err) => {
                removeCaching(eventId)
                if (!(err instanceof AbortedError)) {
                  console.error(err)
                  updateCachingError(
                    eventId,
                    new Error('Could not cache drop', { cause: err })
                  )
                }
              }
            )
          }
        }
      }
    },
    [eventIds, eventsOwners, loadedOwners, completed, caching, inCommon]
  )

  /**
   * @param {number} eventId
   */
  const addCompleted = (eventId) => {
    setCompleted((alsoCompleted) => ({
      ...alsoCompleted,
      [eventId]: true,
    }))
  }

  /**
   * @param {number} eventId
   */
  const removeCompleted = (eventId) => {
    setCompleted((alsoCompleted) => {
      if (alsoCompleted == null) {
        return {}
      }
      /**
       * @type {Record<number, boolean>}
       */
      const newCompleted = {}
      for (const [loadingEventId, loading] of Object.entries(alsoCompleted)) {
        if (String(eventId) !== String(loadingEventId)) {
          newCompleted[loadingEventId] = loading
        }
      }
      return newCompleted
    })
  }

  /**
   * @param {number} eventId
   */
  const addLoading = (eventId) => {
    setLoading((alsoLoading) => ({
      ...alsoLoading,
      [eventId]: true,
    }))
  }

  /**
   * @param {number} eventId
   */
  const removeLoading = (eventId) => {
    setLoading((alsoLoading) => {
      if (alsoLoading == null) {
        return {}
      }
      /**
       * @type {Record<number, boolean>}
       */
      const newLoading = {}
      for (const [loadingEventId, loading] of Object.entries(alsoLoading)) {
        if (String(eventId) !== String(loadingEventId)) {
          newLoading[loadingEventId] = loading
        }
      }
      return newLoading
    })
  }

  /**
   * @param {number} eventId
   * @param {string} address
   * @param {Error} err
   */
  const addError = (eventId, address, err) => {
    setErrors((oldEventOwnerErrors) => ({
      ...(oldEventOwnerErrors ?? {}),
      [eventId]: {
        ...((oldEventOwnerErrors ?? {})[eventId] ?? {}),
        [address]: err,
      },
    }))
  }

  /**
   * @param {number} eventId
   * @param {string} address
   */
  const removeError = (eventId, address) => {
    setErrors((oldEventOwnerErrors) => {
      if (oldEventOwnerErrors == null) {
        return {}
      }
      if (eventId in oldEventOwnerErrors && address in oldEventOwnerErrors[eventId]) {
        if (Object.keys(oldEventOwnerErrors[eventId]).length === 1) {
          delete oldEventOwnerErrors[eventId]
        } else {
          delete oldEventOwnerErrors[eventId][address]
        }
      }
      return oldEventOwnerErrors
    })
  }

  /**
   * @param {number} eventId
   */
  const removeErrors = (eventId) => {
    setErrors((alsoErrors) => {
      if (alsoErrors == null) {
        return {}
      }
      /**
       * @type {Record<number, Record<string, Error>>}
       */
      const newErrors = {}
      for (const [errorEventId, errors] of Object.entries(alsoErrors)) {
        if (String(eventId) !== String(errorEventId)) {
          newErrors[errorEventId] = errors
        }
      }
      return newErrors
    })
  }

  /**
   * @param {number} eventId
   */
  const addLoadedProgress = (eventId) => {
    setLoadedProgress((alsoProgress) => ({
      ...alsoProgress,
      [eventId]: {
        progress: 0,
        estimated: null,
        rate: null,
      },
    }))
  }

  /**
   * @param {number} eventId
   * @param {{ progress: number; estimated: number; rate: number; }} loadedProgress
   */
  const updateLoadedProgress = (eventId, { progress, estimated, rate }) => {
    setLoadedProgress((alsoProgress) => {
      if (alsoProgress[eventId] != null) {
        return {
          ...alsoProgress,
          [eventId]: {
            progress,
            estimated: estimated ?? null,
            rate: rate ?? null,
          },
        }
      }
      return alsoProgress
    })
  }

  /**
   * @param {number} eventId
   */
  const removeLoadedProgress = (eventId) => {
    setLoadedProgress((alsoProgress) => {
      if (alsoProgress == null) {
        return {}
      }
      /**
       * @type {Record<number, { progress: number; estimated: number; rate: number; }>}
       */
      const newProgress = {}
      for (const [loadingEventId, progress] of Object.entries(alsoProgress)) {
        if (String(eventId) !== String(loadingEventId)) {
          newProgress[loadingEventId] = progress
        }
      }
      return newProgress
    })
  }

  /**
   * @param {number} eventId
   */
  const incrLoadedCount = (eventId) => {
    setLoadedOwners((prevLoadedCount) => ({
      ...prevLoadedCount,
      [eventId]: ((prevLoadedCount ?? {})[eventId] ?? 0) + 1,
    }))
  }

  /**
   * @param {number} eventId
   * @param {number} count
   */
  const fixLoadedCount = (eventId, count) => {
    setLoadedOwners((prevLoadedCount) => ({
      ...prevLoadedCount,
      [eventId]: count,
    }))
  }

  /**
   * @param {number} eventId
   * @param {string} address
   * @param {{ id: number; name: string; description?: string; image_url: string; original_url: string; city: string | null; country: string | null; start_date: string; end_date: string; expiry_date: string }} event
   */
  const updateInCommonEvent = (eventId, address, event) => {
    setInCommon((prevEventData) => {
      if (prevEventData == null) {
        return {
          [eventId]: {
            events: {
              [event.id]: event,
            },
            inCommon: {
              [event.id]: [address],
            },
            ts: null,
          },
        }
      }
      if (eventId in prevEventData) {
        if (event.id in prevEventData[eventId].inCommon) {
          if (!prevEventData[eventId].inCommon[event.id].includes(address)) {
            return {
              ...prevEventData,
              [eventId]: {
                events: {
                  ...prevEventData[eventId].events,
                  [event.id]: event,
                },
                inCommon: {
                  ...prevEventData[eventId].inCommon,
                  [event.id]: [
                    ...prevEventData[eventId].inCommon[event.id],
                    address,
                  ],
                },
                ts: null,
              },
            }
          }
          return {
            ...prevEventData,
            [eventId]: {
              events: {
                ...prevEventData[eventId].events,
                [event.id]: event,
              },
              inCommon: prevEventData[eventId].inCommon,
              ts: null,
            },
          }
        }
        return {
          ...prevEventData,
          [eventId]: {
            events: {
              ...prevEventData[eventId].events,
              [event.id]: event,
            },
            inCommon: {
              ...prevEventData[eventId].inCommon,
              [event.id]: [address],
            },
            ts: null,
          },
        }
      }
      return {
        ...prevEventData,
        [eventId]: {
          events: {
            [event.id]: event,
          },
          inCommon: {
            [event.id]: [address],
          },
          ts: null,
        },
      }
    })
  }

  /**
   * @param {number} eventId
   * @param {{ events: Record<number, { id: number; name: string; description?: string; image_url: string; original_url: string; city: string | null; country: string | null; start_date: string; end_date: string; expiry_date: string }>; inCommon: Record<number, string[]>; ts: number }} data
   */
  const updateInCommon = (eventId, data) => {
    setInCommon((prevEventData) => ({
      ...prevEventData,
      [eventId]: {
        events: data.events,
        inCommon: data.inCommon,
        ts: data.ts,
      },
    }))
  }

  /**
   * @param {number} eventId
   */
  const addCaching = (eventId) => {
    setCaching((alsoCaching) => ({
      ...alsoCaching,
      [eventId]: true,
    }))
  }

  /**
   * @param {number} eventId
   */
  const removeCaching = (eventId) => {
    setCaching((alsoCaching) => {
      if (alsoCaching == null) {
        return {}
      }
      /**
       * @type {Record<number, boolean>}
       */
      const newCaching = {}
      for (const [cachingEventId, caching] of Object.entries(alsoCaching)) {
        if (String(eventId) !== String(cachingEventId)) {
          newCaching[cachingEventId] = caching
        }
      }
      return newCaching
    })
  }

  /**
   * @param {number} eventId
   * @param {Error} err
   */
  const updateCachingError = (eventId, err) => {
    setCachingErrors((prevErrors) => ({
      ...prevErrors,
      [eventId]: err,
    }))
  }

  /**
   * @param {number} eventId
   */
  const removeCachingError = (eventId) => {
    setCachingErrors((alsoErrors) => {
      if (alsoErrors == null) {
        return {}
      }
      /**
       * @type {Record<number, Error>}
       */
      const newErrors = {}
      for (const [errorEventId, error] of Object.entries(alsoErrors)) {
        if (String(eventId) !== String(errorEventId)) {
          newErrors[errorEventId] = error
        }
      }
      return newErrors
    })
  }

  /**
   * @param {number} eventId
   * @param {number} [ts]
   */
  const updateCachedTs = (eventId, ts) => {
    if (ts == null) {
      ts = Math.trunc(Date.now() / 1000)
    }
    setInCommon((prevEventData) => ({
      ...(prevEventData ?? {}),
      [eventId]: {
        events: (prevEventData ?? {})[eventId].events,
        inCommon: (prevEventData ?? {})[eventId].inCommon,
        ts,
      },
    }))
  }

  const processEventAddress = useCallback(
    /**
     * @param {number} eventId
     * @param {string} address
     * @param {AbortSignal} [abortSignal]
     */
    async (eventId, address, abortSignal) => {
      removeError(eventId, address)
      let ownerTokens
      try {
        ownerTokens = await scanAddress(address, abortSignal)
      } catch (err) {
        if (!(err instanceof AbortedError)) {
          addError(
            eventId,
            address,
            new Error(`Missing token drop for ${address}`, {
              cause: err,
            })
          )
        }
        return
      }
      for (const ownerToken of ownerTokens) {
        if (ownerToken.event) {
          updateInCommonEvent(eventId, address, ownerToken.event)
        } else {
          addError(
            eventId,
            address,
            new Error(`Missing token drop for ${address}`)
          )
          return
        }
      }
      incrLoadedCount(eventId)
    },
    []
  )

  const processEvent = useCallback(
    /**
     * @param {number} eventId
     * @param {string[]} addresses
     * @param {Record<string, AbortController>} controllers
     */
    async (eventId, addresses, controllers) => {
      removeCompleted(eventId)
      addLoading(eventId)
      removeErrors(eventId)
      let promise = new Promise((r) => { r(undefined) })
      for (const address of addresses) {
        promise = promise.then(() => processEventAddress(
          eventId,
          address,
          controllers[address].signal
        ))
      }
      promise.finally(() => {
        addCompleted(eventId)
        removeLoading(eventId)
      })
      await promise
    },
    [processEventAddress]
  )

  const process = useCallback(
    /**
     * @param {number} eventId
     * @param {string[]} addresses
     * @param {Record<string, AbortController>} controllers
     * @param {AbortController} controller
     */
    async (eventId, addresses, controllers, controller) => {
      if (force) {
        await processEvent(eventId, addresses, controllers)
      } else {
        removeCompleted(eventId)
        addLoading(eventId)
        addLoadedProgress(eventId)
        let result
        try {
          result = await getInCommonEventsWithProgress(
            eventId,
            controller.signal,
            /*onProgress*/({ progress, estimated, rate }) => {
              if (progress != null) {
                updateLoadedProgress(eventId, { progress, estimated, rate })
              } else {
                removeLoadedProgress(eventId)
              }
            }
          )
        } catch (err) {
          removeLoadedProgress(eventId)
          if (!(err instanceof AbortedError)) {
            console.error(err)
            await processEvent(eventId, addresses, controllers)
          } else {
            removeLoading(eventId)
          }
          return
        }
        removeLoadedProgress(eventId)
        if (result == null) {
          await processEvent(eventId, addresses, controllers)
        } else {
          addCompleted(eventId)
          removeLoading(eventId)
          updateInCommon(eventId, result)
          if (eventId in result.inCommon) {
            fixLoadedCount(eventId, result.inCommon[eventId].length)
          }
        }
      }
    },
    [force, processEvent]
  )

  const fetchEventsInCommon = useCallback(
    () => {
      /**
       * @type {AbortController[]}
       */
      const controllers = []
      setCompleted({})
      setLoading({})
      setErrors({})
      setLoadedProgress({})
      setLoadedOwners({})
      setInCommon({})
      let promise = new Promise((r) => { r(undefined) })
      for (const eventId of eventIds) {
        if (eventsOwners[eventId] == null) {
          console.error('Missing event owners', { eventId })
          continue
        }
        const controller = new AbortController()
        /**
         * @type {Record<string, AbortController>}
         */
        const ownersControllers = eventsOwners[eventId].reduce(
          (ctrls, owner) => ({
            ...ctrls,
            [owner]: new AbortController(),
          }),
          {}
        )
        promise = promise.then(
          () => process(
            eventId,
            eventsOwners[eventId],
            ownersControllers,
            controller
          )
        )
        if (all) {
          controllers.push(...Object.values(ownersControllers))
        } else {
          controllers.push(controller, ...Object.values(ownersControllers))
        }
      }
      return () => {
        for (const controller of controllers) {
          controller.abort()
        }
        setCompleted({})
        setLoading({})
        setErrors({})
        setLoadedProgress({})
        setLoadedOwners({})
        setInCommon({})
      }
    },
    [eventIds, eventsOwners, all, process]
  )

  /**
   * @param {number} eventId
   * @param {string} address
   */
  const retryEventAddressInCommon = (eventId, address) => {
    addLoading(eventId)
    removeError(eventId, address)
    const controller = new AbortController()
    processEventAddress(eventId, address, controller.signal).then(() => {
      removeLoading(eventId)
    })
    return () => {
      controller.abort()
    }
  }

  return {
    completedEventsInCommon: Object.keys(completed).length === eventIds.length,
    completedInCommonEvents: completed,
    loadingInCommonEvents: loading,
    eventsInCommonErrors: errors,
    loadedEventsProgress: loadedProgress,
    loadedEventsOwners: loadedOwners,
    eventsInCommon: inCommon,
    cachingEvents: caching,
    cachingEventsErrors: cachingErrors,
    fetchEventsInCommon,
    retryEventAddressInCommon,
  }
}

export default useEventsInCommon
