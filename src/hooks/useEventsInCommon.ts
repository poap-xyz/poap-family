import { useCallback, useEffect, useState } from 'react'
import { getInCommonEventsWithEvents, getInCommonEventsWithProgress } from 'loaders/api'
import { fetchCollectorDrops } from 'loaders/collector'
import { AbortedError } from 'models/error'
import { Drop } from 'models/drop'
import { CountProgress, DownloadProgress } from 'models/http'
import { EventsInCommon } from 'models/api'
import { InCommon, filterInCommon } from 'models/in-common'

function useEventsInCommon(
  dropIds: number[],
  dropsCollectors: InCommon,
  all: boolean = false,
  force: boolean = false,
  local: boolean = false,
  stream: boolean = false,
): {
  completedDropsInCommon: boolean
  completedInCommonDrops: Record<number, boolean>
  loadingInCommonDrops: Record<number, boolean>
  dropsInCommonErrors: Record<number, Record<string, Error>>
  loadedDropsInCommonState: Record<number, 'eventIds-a' | 'eventIds-z' | 'owners-a' | 'owners-z' | 'events-a' | 'events-z'>
  loadedDropsInCommon: Record<number, CountProgress & { totalFinal: boolean }>
  loadedDropsInCommonDrops: Record<number, CountProgress>
  loadedDropsProgress: Record<number, DownloadProgress>
  loadedDropsCollectors: Record<number, number>
  dropsInCommon: Record<number, EventsInCommon>
  fetchDropsInCommon: () => () => void
  retryDropAddressInCommon: (dropId: number, address: string) => () => void
} {
  const [completed, setCompleted] = useState<Record<number, boolean>>({})
  const [loading, setLoading] = useState<Record<number, boolean>>({})
  const [errors, setErrors] = useState<Record<number, Record<string, Error>>>({})
  const [loadedInCommonState, setLoadedInCommonState] = useState<Record<number, 'eventIds-a' | 'eventIds-z' | 'owners-a' | 'owners-z' | 'events-a' | 'events-z'>>({})
  const [loadedInCommon, setLoadedInCommon] = useState<Record<number, CountProgress & { totalFinal: boolean }>>({})
  const [loadedInCommonDrops, setLoadedInCommonDrops] = useState<Record<number, CountProgress>>({})
  const [loadedProgress, setLoadedProgress] = useState<Record<number, DownloadProgress>>({})
  const [loadedCollectors, setLoadedCollectors] = useState<Record<number, number>>({})
  const [inCommon, setInCommon] = useState<Record<number, EventsInCommon>>({})

  useEffect(
    () => {
      for (const dropId of dropIds) {
        if (dropsCollectors[dropId] == null) {
          continue
        }
        if (
          completed[dropId] &&
          (loadedCollectors[dropId] ?? 0) === dropsCollectors[dropId].length &&
          inCommon[dropId] != null &&
          inCommon[dropId].ts == null
        ) {
          const inCommonProcessed = filterInCommon(
            inCommon[dropId].inCommon
          )
          if (Object.keys(inCommonProcessed).length > 0) {
            updateCachedTs(dropId)
          }
        }
      }
    },
    [dropIds, dropsCollectors, loadedCollectors, completed, inCommon]
  )

  function addCompleted(dropId: number): void {
    setCompleted((alsoCompleted) => ({
      ...alsoCompleted,
      [dropId]: true,
    }))
  }

  function removeCompleted(dropId: number): void {
    setCompleted((alsoCompleted) => {
      if (alsoCompleted == null) {
        return {}
      }
      const newCompleted: Record<number, boolean> = {}
      for (const [loadingEventId, loading] of Object.entries(alsoCompleted)) {
        if (String(dropId) !== String(loadingEventId)) {
          newCompleted[loadingEventId] = loading
        }
      }
      return newCompleted
    })
  }

  function addLoading(dropId: number): void {
    setLoading((alsoLoading) => ({
      ...alsoLoading,
      [dropId]: true,
    }))
  }

  function removeLoading(dropId: number): void {
    setLoading((alsoLoading) => {
      if (alsoLoading == null) {
        return {}
      }
      const newLoading: Record<number, boolean> = {}
      for (const [loadingEventId, loading] of Object.entries(alsoLoading)) {
        if (String(dropId) !== String(loadingEventId)) {
          newLoading[loadingEventId] = loading
        }
      }
      return newLoading
    })
  }

  function addError(dropId: number, address: string, err: Error): void {
    setErrors((oldDropCollectorErrors) => ({
      ...(oldDropCollectorErrors ?? {}),
      [dropId]: {
        ...((oldDropCollectorErrors ?? {})[dropId] ?? {}),
        [address]: err,
      },
    }))
  }

  function removeError(dropId: number, address: string): void {
    setErrors((oldDropCollectorErrors) => {
      if (oldDropCollectorErrors == null) {
        return {}
      }
      if (
        dropId in oldDropCollectorErrors &&
        address in oldDropCollectorErrors[dropId]
      ) {
        if (Object.keys(oldDropCollectorErrors[dropId]).length === 1) {
          delete oldDropCollectorErrors[dropId]
        } else {
          delete oldDropCollectorErrors[dropId][address]
        }
      }
      return oldDropCollectorErrors
    })
  }

  function removeErrors(dropId: number): void {
    setErrors((alsoErrors) => {
      if (alsoErrors == null) {
        return {}
      }
      const newErrors: Record<number, Record<string, Error>> = {}
      for (const [errorEventId, errors] of Object.entries(alsoErrors)) {
        if (String(dropId) !== String(errorEventId)) {
          newErrors[errorEventId] = errors
        }
      }
      return newErrors
    })
  }

  function addLoadedInCommonState(
    dropId: number,
    state: 'eventIds-a' | 'eventIds-z' | 'owners-a' | 'owners-z' | 'events-a' | 'events-z',
  ): void {
    setLoadedInCommonState((prevLoadedInCommonState) => ({
      ...(prevLoadedInCommonState ?? {}),
      [dropId]: (prevLoadedInCommonState ?? {})[dropId] == null
        ? state
        : (prevLoadedInCommonState ?? {})[dropId],
    }))
  }

  function updateLoadedInCommonState(
    dropId: number,
    whenPrevState: 'eventIds-a' | 'eventIds-z' | 'owners-a' | 'owners-z' | 'events-a' | 'events-z',
    state: 'eventIds-a' | 'eventIds-z' | 'owners-a' | 'owners-z' | 'events-a' | 'events-z',
  ): void {
    setLoadedInCommonState((prevLoadedInCommonState) => ({
      ...(prevLoadedInCommonState ?? {}),
      [dropId]: (prevLoadedInCommonState ?? {})[dropId] === whenPrevState
        ? state
        : (prevLoadedInCommonState ?? {})[dropId],
    }))
  }

  function removeLoadedInCommonState(dropId: number): void {
    setLoadedInCommonState((prevLoadedInCommonState) => {
      if (prevLoadedInCommonState == null) {
        return {}
      }
      const newProgress: Record<number, 'eventIds-a' | 'eventIds-z' | 'owners-a' | 'owners-z' | 'events-a' | 'events-z'> = {}
      for (const [loadingEventId, progress] of Object.entries(prevLoadedInCommonState)) {
        if (String(dropId) !== String(loadingEventId)) {
          newProgress[loadingEventId] = progress
        }
      }
      return newProgress
    })
  }

  function updateLoadedInCommon(
    dropId: number,
    { count, total }: CountProgress,
    totalFinal: boolean,
  ) {
    setLoadedInCommon((prevLoadedInCommon) => ({
      ...(prevLoadedInCommon ?? {}),
      [dropId]: { count, total, totalFinal },
    }))
  }

  function removeLoadedInCommon(dropId: number): void {
    setLoadedInCommon((prevLoadedInCommon) => {
      if (prevLoadedInCommon == null) {
        return {}
      }
      const newProgress: Record<number, CountProgress & { totalFinal: boolean }> = {}
      for (const [loadingEventId, progress] of Object.entries(prevLoadedInCommon)) {
        if (String(dropId) !== String(loadingEventId)) {
          newProgress[loadingEventId] = progress
        }
      }
      return newProgress
    })
  }

  function updateLoadedInCommonDrops(
    dropId: number,
    { count, total }: CountProgress,
  ) {
    setLoadedInCommonDrops((prevLoadedInCommonDrops) => ({
      ...(prevLoadedInCommonDrops ?? {}),
      [dropId]: { count, total },
    }))
  }

  function removeLoadedInCommonDrops(dropId: number): void {
    setLoadedInCommonDrops((prevLoadedInCommonDrops) => {
      if (prevLoadedInCommonDrops == null) {
        return {}
      }
      const newProgress: Record<number, CountProgress> = {}
      for (const [loadingEventId, progress] of Object.entries(prevLoadedInCommonDrops)) {
        if (String(dropId) !== String(loadingEventId)) {
          newProgress[loadingEventId] = progress
        }
      }
      return newProgress
    })
  }

  function addLoadedProgress(dropId: number): void {
    setLoadedProgress((alsoProgress) => ({
      ...alsoProgress,
      [dropId]: {
        progress: 0,
        estimated: null,
        rate: null,
      },
    }))
  }

  function updateLoadedProgress(
    dropId: number,
    { progress, estimated, rate }: DownloadProgress,
  ): void {
    setLoadedProgress((alsoProgress) => {
      if (alsoProgress[dropId] != null) {
        return {
          ...alsoProgress,
          [dropId]: {
            progress,
            estimated: estimated ?? null,
            rate: rate ?? null,
          },
        }
      }
      return alsoProgress
    })
  }

  function removeLoadedProgress(dropId: number): void {
    setLoadedProgress((alsoProgress) => {
      if (alsoProgress == null) {
        return {}
      }
      const newProgress: Record<number, DownloadProgress> = {}
      for (const [loadingEventId, progress] of Object.entries(alsoProgress)) {
        if (String(dropId) !== String(loadingEventId)) {
          newProgress[loadingEventId] = progress
        }
      }
      return newProgress
    })
  }

  function incrLoadedCount(dropId: number): void {
    setLoadedCollectors((prevLoadedCount) => ({
      ...prevLoadedCount,
      [dropId]: ((prevLoadedCount ?? {})[dropId] ?? 0) + 1,
    }))
  }

  function fixLoadedCount(dropId: number, count: number): void {
    setLoadedCollectors((prevLoadedCount) => ({
      ...prevLoadedCount,
      [dropId]: count,
    }))
  }

  function updateInCommonEvent(
    dropId: number,
    address: string,
    drop: Drop,
  ): void {
    setInCommon((prevEventData) => {
      if (prevEventData == null) {
        return {
          [dropId]: {
            events: {
              [drop.id]: drop,
            },
            inCommon: {
              [drop.id]: [address],
            },
            ts: null,
          },
        }
      }
      if (dropId in prevEventData) {
        if (drop.id in prevEventData[dropId].inCommon) {
          if (!prevEventData[dropId].inCommon[drop.id].includes(address)) {
            return {
              ...prevEventData,
              [dropId]: {
                events: {
                  ...prevEventData[dropId].events,
                  [drop.id]: drop,
                },
                inCommon: {
                  ...prevEventData[dropId].inCommon,
                  [drop.id]: [
                    ...prevEventData[dropId].inCommon[drop.id],
                    address,
                  ],
                },
                ts: null,
              },
            }
          }
          return {
            ...prevEventData,
            [dropId]: {
              events: {
                ...prevEventData[dropId].events,
                [drop.id]: drop,
              },
              inCommon: prevEventData[dropId].inCommon,
              ts: null,
            },
          }
        }
        return {
          ...prevEventData,
          [dropId]: {
            events: {
              ...prevEventData[dropId].events,
              [drop.id]: drop,
            },
            inCommon: {
              ...prevEventData[dropId].inCommon,
              [drop.id]: [address],
            },
            ts: null,
          },
        }
      }
      return {
        ...prevEventData,
        [dropId]: {
          events: {
            [drop.id]: drop,
          },
          inCommon: {
            [drop.id]: [address],
          },
          ts: null,
        },
      }
    })
  }

  function updateInCommon(
    dropId: number,
    data: EventsInCommon,
  ): void {
    setInCommon((prevEventData) => ({
      ...prevEventData,
      [dropId]: {
        events: data.events,
        inCommon: data.inCommon,
        ts: data.ts,
      },
    }))
  }

  function updateCachedTs(dropId: number, ts?: number): void {
    if (ts == null) {
      ts = Math.trunc(Date.now() / 1000)
    }
    setInCommon((prevEventData) => ({
      ...(prevEventData ?? {}),
      [dropId]: {
        events: (prevEventData ?? {})[dropId].events,
        inCommon: (prevEventData ?? {})[dropId].inCommon,
        ts,
      },
    }))
  }

  const processEventAddress = useCallback(
    async (dropId: number, address: string, abortSignal: AbortSignal) => {
      removeError(dropId, address)
      let collectorDrops: Drop[]
      try {
        collectorDrops = await fetchCollectorDrops(address, abortSignal)
      } catch (err: unknown) {
        if (!(err instanceof AbortedError)) {
          addError(
            dropId,
            address,
            new Error(`Missing token drop for ${address}`, {
              cause: err,
            })
          )
        }
        return
      }
      incrLoadedCount(dropId)
      for (const collectorDrop of collectorDrops) {
        updateInCommonEvent(dropId, address, collectorDrop)
      }
    },
    []
  )

  const processEvent = useCallback(
    async (
      dropId: number,
      addresses: string[],
      controllers: Record<string, AbortController>,
    ) => {
      removeCompleted(dropId)
      addLoading(dropId)
      removeErrors(dropId)
      let promise = new Promise((r) => { r(undefined) })
      for (const address of addresses) {
        promise = promise.then(() => processEventAddress(
          dropId,
          address,
          controllers[address].signal
        ))
      }
      promise.finally(() => {
        addCompleted(dropId)
        removeLoading(dropId)
      })
      await promise
    },
    [processEventAddress]
  )

  const process = useCallback(
    async (
      dropId: number,
      addresses: string[],
      controllers: Record<string, AbortController>,
      controller: AbortController,
    ) => {
      if (local) {
        await processEvent(dropId, addresses, controllers)
      } else {
        removeCompleted(dropId)
        addLoading(dropId)
        let result: EventsInCommon | null = null
        try {
          if (stream) {
            result = await getInCommonEventsWithEvents(
              dropId,
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
                  addLoadedInCommonState(dropId, 'eventIds-a')
                  updateLoadedInCommon(
                    dropId,
                    {
                      count: receivedOwners ?? 0,
                      total: receivedEventIds,
                    },
                    receivedEventIds === totalInCommon
                  )
                  if (receivedEventIds === totalInCommon) {
                    updateLoadedInCommonState(dropId, 'eventIds-a', 'eventIds-z')
                  }
                }
                if (receivedOwners) {
                  updateLoadedInCommonState(dropId, 'eventIds-z', 'owners-a')
                  if (receivedOwners === receivedEventIds) {
                    updateLoadedInCommonState(dropId, 'owners-a', 'owners-z')
                  }
                }
                if (totalEvents) {
                  updateLoadedInCommonState(dropId, 'owners-z', 'events-a')
                  updateLoadedInCommonDrops(dropId, {
                    count: receivedEvents ?? 0,
                    total: totalEvents,
                  })
                  if (receivedEvents === totalEvents) {
                    updateLoadedInCommonState(dropId, 'events-a', 'events-z')
                  }
                }
              },
            )
            removeLoadedInCommonState(dropId)
            removeLoadedInCommon(dropId)
            removeLoadedInCommonDrops(dropId)
          } else {
            addLoadedProgress(dropId)
            result = await getInCommonEventsWithProgress(
              dropId,
              /*abortSignal*/controller.signal,
              /*onProgress*/({ progress, estimated, rate }) => {
                if (progress != null) {
                  updateLoadedProgress(dropId, { progress, estimated, rate })
                } else {
                  removeLoadedProgress(dropId)
                }
              },
              /*refresh*/force
            )
            removeLoadedProgress(dropId)
          }
        } catch (err: unknown) {
          removeLoadedInCommonState(dropId)
          removeLoadedInCommon(dropId)
          removeLoadedInCommonDrops(dropId)
          removeLoadedProgress(dropId)
          if (!(err instanceof AbortedError)) {
            console.error(err)
            await processEvent(dropId, addresses, controllers)
          } else {
            removeLoading(dropId)
          }
          return
        }
        removeLoadedInCommonState(dropId)
        removeLoadedInCommon(dropId)
        removeLoadedInCommonDrops(dropId)
        removeLoadedProgress(dropId)
        if (result == null) {
          await processEvent(dropId, addresses, controllers)
        } else {
          addCompleted(dropId)
          removeLoading(dropId)
          updateInCommon(dropId, result)
          if (dropId in result.inCommon) {
            fixLoadedCount(dropId, result.inCommon[dropId].length)
          }
        }
      }
    },
    [force, local, stream, processEvent]
  )

  const fetchDropsInCommon = useCallback(
    () => {
      const controllers: AbortController[] = []
      setCompleted({})
      setLoading({})
      setErrors({})
      setLoadedInCommon({})
      setLoadedProgress({})
      setLoadedCollectors({})
      setInCommon({})
      let promise = new Promise((r) => { r(undefined) })
      for (const dropId of dropIds) {
        if (dropsCollectors[dropId] == null) {
          console.error('Missing drop collectors', { dropId })
          continue
        }
        const controller = new AbortController()
        const collectorsControllers: Record<string, AbortController> =
          dropsCollectors[dropId].reduce(
            (ctrls, collector) => ({
              ...ctrls,
              [collector]: new AbortController(),
            }),
            {}
          )
        promise = promise.then(
          () => process(
            dropId,
            dropsCollectors[dropId],
            collectorsControllers,
            controller
          )
        )
        if (all) {
          controllers.push(...Object.values(collectorsControllers))
        } else {
          controllers.push(controller, ...Object.values(collectorsControllers))
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
        setLoadedCollectors({})
        setInCommon({})
      }
    },
    [dropIds, dropsCollectors, all, process]
  )

  function retryDropAddressInCommon(
    dropId: number,
    address: string,
  ): () => void {
    addLoading(dropId)
    removeError(dropId, address)
    const controller = new AbortController()
    processEventAddress(dropId, address, controller.signal).then(() => {
      removeLoading(dropId)
    })
    return () => {
      controller.abort()
    }
  }

  return {
    completedDropsInCommon: Object.keys(completed).length === dropIds.length,
    completedInCommonDrops: completed,
    loadingInCommonDrops: loading,
    dropsInCommonErrors: errors,
    loadedDropsInCommonState: loadedInCommonState,
    loadedDropsInCommon: loadedInCommon,
    loadedDropsInCommonDrops: loadedInCommonDrops,
    loadedDropsProgress: loadedProgress,
    loadedDropsCollectors: loadedCollectors,
    dropsInCommon: inCommon,
    fetchDropsInCommon,
    retryDropAddressInCommon,
  }
}

export default useEventsInCommon
