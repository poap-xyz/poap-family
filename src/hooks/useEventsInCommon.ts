import { useCallback, useEffect, useState } from 'react'
import { getInCommonEventsWithEvents, getInCommonEventsWithProgress } from 'loaders/api'
import { scanAddress } from 'loaders/poap'
import { AbortedError } from 'models/error'
import { POAP } from 'models/poap'
import { Drop } from 'models/drop'
import { CountProgress, DownloadProgress } from 'models/http'
import { EventsInCommon, InCommon } from 'models/api'
import { filterInCommon } from 'models/in-common'

function useEventsInCommon(
  eventIds: number[],
  eventsOwners: InCommon,
  all: boolean = false,
  force: boolean = false,
  local: boolean = false,
  stream: boolean = false,
): {
  completedEventsInCommon: boolean
  completedInCommonEvents: Record<number, boolean>
  loadingInCommonEvents: Record<number, boolean>
  eventsInCommonErrors: Record<number, Record<string, Error>>
  loadedEventsInCommonState: Record<number, 'eventIds-a' | 'eventIds-z' | 'owners-a' | 'owners-z' | 'events-a' | 'events-z'>
  loadedEventsInCommon: Record<number, CountProgress & { totalFinal: boolean }>
  loadedEventsInCommonEvents: Record<number, CountProgress>
  loadedEventsProgress: Record<number, DownloadProgress>
  loadedEventsOwners: Record<number, number>
  eventsInCommon: Record<number, EventsInCommon>
  fetchEventsInCommon: () => () => void
  retryEventAddressInCommon: (eventId: number, address: string) => () => void
} {
  const [completed, setCompleted] = useState<Record<number, boolean>>({})
  const [loading, setLoading] = useState<Record<number, boolean>>({})
  const [errors, setErrors] = useState<Record<number, Record<string, Error>>>({})
  const [loadedInCommonState, setLoadedInCommonState] = useState<Record<number, 'eventIds-a' | 'eventIds-z' | 'owners-a' | 'owners-z' | 'events-a' | 'events-z'>>({})
  const [loadedInCommon, setLoadedInCommon] = useState<Record<number, CountProgress & { totalFinal: boolean }>>({})
  const [loadedInCommonEvents, setLoadedInCommonEvents] = useState<Record<number, CountProgress>>({})
  const [loadedProgress, setLoadedProgress] = useState<Record<number, DownloadProgress>>({})
  const [loadedOwners, setLoadedOwners] = useState<Record<number, number>>({})
  const [inCommon, setInCommon] = useState<Record<number, EventsInCommon>>({})

  useEffect(
    () => {
      for (const eventId of eventIds) {
        if (eventsOwners[eventId] == null) {
          continue
        }
        if (
          completed[eventId] &&
          (loadedOwners[eventId] ?? 0) === eventsOwners[eventId].length &&
          inCommon[eventId] != null &&
          inCommon[eventId].ts == null
        ) {
          const inCommonProcessed = filterInCommon(
            inCommon[eventId].inCommon
          )
          if (Object.keys(inCommonProcessed).length > 0) {
            updateCachedTs(eventId)
          }
        }
      }
    },
    [eventIds, eventsOwners, loadedOwners, completed, inCommon]
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

  function addLoadedInCommonState(
    eventId: number,
    state: 'eventIds-a' | 'eventIds-z' | 'owners-a' | 'owners-z' | 'events-a' | 'events-z',
  ): void {
    setLoadedInCommonState((prevLoadedInCommonState) => ({
      ...(prevLoadedInCommonState ?? {}),
      [eventId]: (prevLoadedInCommonState ?? {})[eventId] == null
        ? state
        : (prevLoadedInCommonState ?? {})[eventId],
    }))
  }

  function updateLoadedInCommonState(
    eventId: number,
    whenPrevState: 'eventIds-a' | 'eventIds-z' | 'owners-a' | 'owners-z' | 'events-a' | 'events-z',
    state: 'eventIds-a' | 'eventIds-z' | 'owners-a' | 'owners-z' | 'events-a' | 'events-z',
  ): void {
    setLoadedInCommonState((prevLoadedInCommonState) => ({
      ...(prevLoadedInCommonState ?? {}),
      [eventId]: (prevLoadedInCommonState ?? {})[eventId] === whenPrevState
        ? state
        : (prevLoadedInCommonState ?? {})[eventId],
    }))
  }

  function removeLoadedInCommonState(eventId: number): void {
    setLoadedInCommonState((prevLoadedInCommonState) => {
      if (prevLoadedInCommonState == null) {
        return {}
      }
      const newProgress: Record<number, 'eventIds-a' | 'eventIds-z' | 'owners-a' | 'owners-z' | 'events-a' | 'events-z'> = {}
      for (const [loadingEventId, progress] of Object.entries(prevLoadedInCommonState)) {
        if (String(eventId) !== String(loadingEventId)) {
          newProgress[loadingEventId] = progress
        }
      }
      return newProgress
    })
  }

  function updateLoadedInCommon(
    eventId: number,
    { count, total }: CountProgress,
    totalFinal: boolean,
  ) {
    setLoadedInCommon((prevLoadedInCommon) => ({
      ...(prevLoadedInCommon ?? {}),
      [eventId]: { count, total, totalFinal },
    }))
  }

  function removeLoadedInCommon(eventId: number): void {
    setLoadedInCommon((prevLoadedInCommon) => {
      if (prevLoadedInCommon == null) {
        return {}
      }
      const newProgress: Record<number, CountProgress & { totalFinal: boolean }> = {}
      for (const [loadingEventId, progress] of Object.entries(prevLoadedInCommon)) {
        if (String(eventId) !== String(loadingEventId)) {
          newProgress[loadingEventId] = progress
        }
      }
      return newProgress
    })
  }

  function updateLoadedInCommonEvents(
    eventId: number,
    { count, total }: CountProgress,
  ) {
    setLoadedInCommonEvents((prevLoadedInCommonEvents) => ({
      ...(prevLoadedInCommonEvents ?? {}),
      [eventId]: { count, total },
    }))
  }

  function removeLoadedInCommonEvents(eventId: number): void {
    setLoadedInCommonEvents((prevLoadedInCommonEvents) => {
      if (prevLoadedInCommonEvents == null) {
        return {}
      }
      const newProgress: Record<number, CountProgress> = {}
      for (const [loadingEventId, progress] of Object.entries(prevLoadedInCommonEvents)) {
        if (String(eventId) !== String(loadingEventId)) {
          newProgress[loadingEventId] = progress
        }
      }
      return newProgress
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
    { progress, estimated, rate }: DownloadProgress,
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
      const newProgress: Record<number, DownloadProgress> = {}
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
      if (local) {
        await processEvent(eventId, addresses, controllers)
      } else {
        removeCompleted(eventId)
        addLoading(eventId)
        let result: EventsInCommon | null = null
        try {
          if (stream) {
            result = await getInCommonEventsWithEvents(
              eventId,
              /*refresh*/force,
              /*abortSignal*/controller.signal,
              /*onProgress*/(
                receivedOwners,
                receivedEventIds,
                totalInCommon,
                receivedEvents,
                totalEvents
              ) => {
                if (receivedEventIds) {
                  addLoadedInCommonState(eventId, 'eventIds-a')
                  updateLoadedInCommon(
                    eventId,
                    {
                      count: receivedOwners ?? 0,
                      total: receivedEventIds,
                    },
                    receivedEventIds === totalInCommon
                  )
                  if (receivedEventIds === totalInCommon) {
                    updateLoadedInCommonState(eventId, 'eventIds-a', 'eventIds-z')
                  }
                }
                if (receivedOwners) {
                  updateLoadedInCommonState(eventId, 'eventIds-z', 'owners-a')
                  if (receivedOwners === receivedEventIds) {
                    updateLoadedInCommonState(eventId, 'owners-a', 'owners-z')
                  }
                }
                if (totalEvents) {
                  updateLoadedInCommonState(eventId, 'owners-z', 'events-a')
                  updateLoadedInCommonEvents(eventId, {
                    count: receivedEvents ?? 0,
                    total: totalEvents,
                  })
                  if (receivedEvents === totalEvents) {
                    updateLoadedInCommonState(eventId, 'events-a', 'events-z')
                  }
                }
              },
            )
            removeLoadedInCommonState(eventId)
            removeLoadedInCommon(eventId)
            removeLoadedInCommonEvents(eventId)
          } else {
            addLoadedProgress(eventId)
            result = await getInCommonEventsWithProgress(
              eventId,
              /*abortSignal*/controller.signal,
              /*onProgress*/({ progress, estimated, rate }) => {
                if (progress != null) {
                  updateLoadedProgress(eventId, { progress, estimated, rate })
                } else {
                  removeLoadedProgress(eventId)
                }
              },
              /*refresh*/force
            )
            removeLoadedProgress(eventId)
          }
        } catch (err: unknown) {
          removeLoadedInCommonState(eventId)
          removeLoadedInCommon(eventId)
          removeLoadedInCommonEvents(eventId)
          removeLoadedProgress(eventId)
          if (!(err instanceof AbortedError)) {
            console.error(err)
            await processEvent(eventId, addresses, controllers)
          } else {
            removeLoading(eventId)
          }
          return
        }
        removeLoadedInCommonState(eventId)
        removeLoadedInCommon(eventId)
        removeLoadedInCommonEvents(eventId)
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
    [force, local, stream, processEvent]
  )

  const fetchEventsInCommon = useCallback(
    () => {
      const controllers: AbortController[] = []
      setCompleted({})
      setLoading({})
      setErrors({})
      setLoadedInCommon({})
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
        setLoadedInCommon({})
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
    loadedEventsInCommonState: loadedInCommonState,
    loadedEventsInCommon: loadedInCommon,
    loadedEventsInCommonEvents: loadedInCommonEvents,
    loadedEventsProgress: loadedProgress,
    loadedEventsOwners: loadedOwners,
    eventsInCommon: inCommon,
    fetchEventsInCommon,
    retryEventAddressInCommon,
  }
}

export default useEventsInCommon
