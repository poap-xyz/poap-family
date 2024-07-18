import { useCallback, useEffect, useState } from 'react'
import { getInCommonEventsWithProgress, putEventInCommon } from 'loaders/api'
import { scanAddress } from 'loaders/poap'
import { AbortedError } from 'models/error'
import { filterInCommon } from 'models/in-common'
import { POAP } from 'models/poap'
import { Drop } from 'models/drop'
import { Progress } from 'models/http'
import { InCommon } from 'models/api'

interface EventsInCommon {
  events: Record<number, Drop>
  inCommon: InCommon
  ts: number | null
}

function useEventsInCommon(
  eventIds: number[],
  eventsOwners: InCommon,
  all: boolean = false,
  force: boolean = false,
): {
  completedEventsInCommon: boolean
  completedInCommonEvents: Record<number, boolean>
  loadingInCommonEvents: Record<number, boolean>
  eventsInCommonErrors: Record<number, Record<string, Error>>
  loadedEventsProgress: Record<number, Progress>
  loadedEventsOwners: Record<number, number>
  eventsInCommon: Record<number, EventsInCommon>
  cachingEvents: Record<number, boolean>
  cachingEventsErrors: Record<number, Error>
  fetchEventsInCommon: () => () => void
  retryEventAddressInCommon: (eventId: number, address: string) => () => void
} {
  const [completed, setCompleted] = useState<Record<number, boolean>>({})
  const [loading, setLoading] = useState<Record<number, boolean>>({})
  const [errors, setErrors] = useState<Record<number, Record<string, Error>>>({})
  const [loadedProgress, setLoadedProgress] = useState<Record<number, Progress>>({})
  const [loadedOwners, setLoadedOwners] = useState<Record<number, number>>({})
  const [inCommon, setInCommon] = useState<Record<number, EventsInCommon>>({})
  const [caching, setCaching] = useState<Record<number, boolean>>({})
  const [cachingErrors, setCachingErrors] = useState<Record<number, Error>>({})

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

  function addCompleted(eventId: number): void {
    setCompleted((alsoCompleted) => ({
      ...alsoCompleted,
      [eventId]: true,
    }))
  }

  function removeCompleted(eventId: number): void {
    setCompleted((alsoCompleted) => {
      if (alsoCompleted == null) {
        return {}
      }
      const newCompleted: Record<number, boolean> = {}
      for (const [loadingEventId, loading] of Object.entries(alsoCompleted)) {
        if (String(eventId) !== String(loadingEventId)) {
          newCompleted[loadingEventId] = loading
        }
      }
      return newCompleted
    })
  }

  function addLoading(eventId: number): void {
    setLoading((alsoLoading) => ({
      ...alsoLoading,
      [eventId]: true,
    }))
  }

  function removeLoading(eventId: number): void {
    setLoading((alsoLoading) => {
      if (alsoLoading == null) {
        return {}
      }
      const newLoading: Record<number, boolean> = {}
      for (const [loadingEventId, loading] of Object.entries(alsoLoading)) {
        if (String(eventId) !== String(loadingEventId)) {
          newLoading[loadingEventId] = loading
        }
      }
      return newLoading
    })
  }

  function addError(eventId: number, address: string, err: Error): void {
    setErrors((oldEventOwnerErrors) => ({
      ...(oldEventOwnerErrors ?? {}),
      [eventId]: {
        ...((oldEventOwnerErrors ?? {})[eventId] ?? {}),
        [address]: err,
      },
    }))
  }

  function removeError(eventId: number, address: string): void {
    setErrors((oldEventOwnerErrors) => {
      if (oldEventOwnerErrors == null) {
        return {}
      }
      if (
        eventId in oldEventOwnerErrors &&
        address in oldEventOwnerErrors[eventId]
      ) {
        if (Object.keys(oldEventOwnerErrors[eventId]).length === 1) {
          delete oldEventOwnerErrors[eventId]
        } else {
          delete oldEventOwnerErrors[eventId][address]
        }
      }
      return oldEventOwnerErrors
    })
  }

  function removeErrors(eventId: number): void {
    setErrors((alsoErrors) => {
      if (alsoErrors == null) {
        return {}
      }
      const newErrors: Record<number, Record<string, Error>> = {}
      for (const [errorEventId, errors] of Object.entries(alsoErrors)) {
        if (String(eventId) !== String(errorEventId)) {
          newErrors[errorEventId] = errors
        }
      }
      return newErrors
    })
  }

  function addLoadedProgress(eventId: number): void {
    setLoadedProgress((alsoProgress) => ({
      ...alsoProgress,
      [eventId]: {
        progress: 0,
        estimated: null,
        rate: null,
      },
    }))
  }

  function updateLoadedProgress(
    eventId: number,
    { progress, estimated, rate }: Progress,
  ): void {
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

  function removeLoadedProgress(eventId: number): void {
    setLoadedProgress((alsoProgress) => {
      if (alsoProgress == null) {
        return {}
      }
      const newProgress: Record<number, Progress> = {}
      for (const [loadingEventId, progress] of Object.entries(alsoProgress)) {
        if (String(eventId) !== String(loadingEventId)) {
          newProgress[loadingEventId] = progress
        }
      }
      return newProgress
    })
  }

  function incrLoadedCount(eventId: number): void {
    setLoadedOwners((prevLoadedCount) => ({
      ...prevLoadedCount,
      [eventId]: ((prevLoadedCount ?? {})[eventId] ?? 0) + 1,
    }))
  }

  function fixLoadedCount(eventId: number, count: number): void {
    setLoadedOwners((prevLoadedCount) => ({
      ...prevLoadedCount,
      [eventId]: count,
    }))
  }

  function updateInCommonEvent(
    eventId: number,
    address: string,
    event: Drop,
  ): void {
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

  function updateInCommon(
    eventId: number,
    data: EventsInCommon,
  ): void {
    setInCommon((prevEventData) => ({
      ...prevEventData,
      [eventId]: {
        events: data.events,
        inCommon: data.inCommon,
        ts: data.ts,
      },
    }))
  }

  function addCaching(eventId: number): void {
    setCaching((alsoCaching) => ({
      ...alsoCaching,
      [eventId]: true,
    }))
  }

  function removeCaching(eventId: number): void {
    setCaching((alsoCaching) => {
      if (alsoCaching == null) {
        return {}
      }
      const newCaching: Record<number, boolean> = {}
      for (const [cachingEventId, caching] of Object.entries(alsoCaching)) {
        if (String(eventId) !== String(cachingEventId)) {
          newCaching[cachingEventId] = caching
        }
      }
      return newCaching
    })
  }

  function updateCachingError(eventId: number, err: Error): void {
    setCachingErrors((prevErrors) => ({
      ...prevErrors,
      [eventId]: err,
    }))
  }

  function removeCachingError(eventId: number): void {
    setCachingErrors((alsoErrors) => {
      if (alsoErrors == null) {
        return {}
      }
      const newErrors: Record<number, Error> = {}
      for (const [errorEventId, error] of Object.entries(alsoErrors)) {
        if (String(eventId) !== String(errorEventId)) {
          newErrors[errorEventId] = error
        }
      }
      return newErrors
    })
  }

  function updateCachedTs(eventId: number, ts?: number): void {
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
    async (eventId: number, address: string, abortSignal: AbortSignal) => {
      removeError(eventId, address)
      let ownerTokens: POAP[]
      try {
        ownerTokens = await scanAddress(address, abortSignal)
      } catch (err: unknown) {
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
    async (
      eventId: number,
      addresses: string[],
      controllers: Record<string, AbortController>,
    ) => {
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
    async (
      eventId: number,
      addresses: string[],
      controllers: Record<string, AbortController>,
      controller: AbortController,
    ) => {
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
        } catch (err: unknown) {
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
      const controllers: AbortController[] = []
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
        const ownersControllers: Record<string, AbortController> =
          eventsOwners[eventId].reduce(
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

  function retryEventAddressInCommon(
    eventId: number,
    address: string,
  ): () => void {
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
