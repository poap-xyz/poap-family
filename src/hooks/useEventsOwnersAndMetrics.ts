import { useCallback, useState } from 'react'
import { filterInvalidOwners } from 'models/address'
import { DropMetrics } from 'models/drop'
import { AbortedError } from 'models/error'
import { EventAndOwners } from 'models/api'
import { fetchCollectorsByDrops, fetchDropsCollectors } from 'loaders/collector'
import { fetchDropMetrics, fetchDropsMetrics } from 'loaders/drop'
import { getEventAndOwners } from 'loaders/api'
import { fillNull } from 'utils/object'

function useEventsOwnersAndMetrics(eventIds: number[], expiryDates: Record<number, Date>, force: boolean = false): {
  completedEventsOwnersAndMetrics: boolean
  loadingEventsOwnersAndMetrics: boolean
  loadingOwnersAndMetricsEvents: Record<number, boolean>
  eventsOwnersAndMetricsErrors: Record<number, Error>
  eventsOwners: Record<number, string[]>
  eventsMetrics: Record<number, DropMetrics>
  fetchEventsOwnersAndMetrics: () => () => void
  retryEventOwnersAndMetrics: (eventId: number) => () => void
} {
  const [completed, setCompleted] = useState<boolean>(false)
  const [loadingCache, setLoadingCache] = useState<boolean>(false)
  const [loading, setLoading] = useState<Record<number, boolean>>({})
  const [errors, setErrors] = useState<Record<number, Error>>({})
  const [owners, setOwners] = useState<Record<number, string[]>>({})
  const [metrics, setMetrics] = useState<Record<number, DropMetrics>>({})

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

  function addError(eventId: number, err: Error): void {
    setErrors((prevErrors) => ({
      ...prevErrors,
      [eventId]: err,
    }))
  }

  function removeError(eventId: number): void {
    setErrors((alsoErrors) => {
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

  function updateEventOwners(eventId: number, owners: string[]): void {
    setOwners((prevOwners) => ({
      ...prevOwners,
      [eventId]: filterInvalidOwners(owners),
    }))
  }

  function updateEventsOwners(eventsOwners: Record<number, string[]>): void {
    setOwners((prevOwners) => ({
      ...prevOwners,
      ...Object.fromEntries(
        Object.entries(eventsOwners)
          .filter(([, eventOwners]) => eventOwners != null)
          .map(
            ([rawEventId, owners]) => [
              rawEventId,
              filterInvalidOwners(owners),
            ]
          )
      ),
    }))
  }

  function updateEventMetrics(eventId: number, metrics: DropMetrics): void {
    if (metrics == null) {
      return
    }
    setMetrics((prevMetrics) => ({
      ...prevMetrics,
      [eventId]: metrics,
    }))
  }

  function updateEventsMetrics(eventsMetrics: Record<number, DropMetrics>): void {
    setMetrics((prevMetrics) => ({
      ...prevMetrics,
      ...Object.fromEntries(
        Object.entries(eventsMetrics).filter(([, metrics]) => metrics != null)
      ),
    }))
  }

  const loadCachedOwnersAndMetrics = useCallback(
    async (eventId: number, abortSignal: AbortSignal) => {
      removeError(eventId)
      addLoading(eventId)
      let eventAndOwners: EventAndOwners | null = null
      try {
        eventAndOwners = await getEventAndOwners(
          eventId,
          abortSignal,
          /*includeDescription*/false,
          /*includeMetrics*/true,
          /*refresh*/false
        )
      } catch (err: unknown) {
        removeLoading(eventId)
        if (!(err instanceof AbortedError)) {
          addError(eventId, new Error(
            'Could not fetch drop and collectors',
            { cause: err }
          ))
        }
        return
      }
      removeLoading(eventId)
      if (eventAndOwners != null) {
        updateEventOwners(eventId, eventAndOwners.owners)
        if (eventAndOwners.metrics) {
          updateEventMetrics(eventId, eventAndOwners.metrics)
        }
      } else {
        addError(
          eventId,
          new Error('Could not fetch drop and collectors')
        )
      }
    },
    []
  )

  const loadOwnersAndMetrics = useCallback(
    async (eventId: number, abortSignal: AbortSignal) => {
      removeError(eventId)
      addLoading(eventId)
      let eventCollectorsResult: PromiseSettledResult<Awaited<ReturnType<typeof fetchDropsCollectors>>>
      let eventMetricsResult: PromiseSettledResult<Awaited<ReturnType<typeof fetchDropMetrics>>>
      try {
        [eventCollectorsResult, eventMetricsResult] = await Promise.allSettled([
          fetchDropsCollectors([eventId], abortSignal),
          fetchDropMetrics(eventId, abortSignal),
        ])
      } catch (err: unknown) {
        removeLoading(eventId)
        if (!(err instanceof AbortedError)) {
          addError(
            eventId,
            new Error('Could not fetch collectors or metrics', {
              cause: err,
            })
          )
        }
        return
      }
      removeLoading(eventId)
      if (eventCollectorsResult.status === 'fulfilled') {
        updateEventOwners(
          eventId,
          eventCollectorsResult.value
        )
      } else {
        if (!(eventCollectorsResult.reason instanceof AbortedError)) {
          console.error(eventCollectorsResult.reason)
          addError(
            eventId,
            new Error(`Collectors for drop '${eventId}' failed to fetch`, {
              cause: eventCollectorsResult.reason,
            })
          )
        }
      }
      if (eventMetricsResult.status === 'fulfilled') {
        if (eventMetricsResult.value) {
          updateEventMetrics(eventId, eventMetricsResult.value)
        }
      } else {
        if (!(eventMetricsResult.reason instanceof AbortedError)) {
          console.error(eventMetricsResult.reason)
        }
      }
    },
    []
  )

  const fetchEventsOwnersAndMetrics = useCallback(
    () => {
      let controller: AbortController | undefined
      const controllers: Record<number, AbortController> = eventIds.reduce(
        (ctrls, eventId) => ({
          ...ctrls,
          [eventId]: new AbortController(),
        }),
        {}
      )
      setCompleted(false)
      setLoadingCache(false)
      setLoading({})
      setErrors({})
      setOwners({})
      setMetrics({})
      if (force) {
        let promise = new Promise((r) => { r(undefined) })
        for (const eventId of eventIds) {
          promise = promise.then(
            () => loadOwnersAndMetrics(eventId, controllers[eventId].signal)
          )
        }
        promise.finally(() => {
          setCompleted(true)
        })
      } else {
        setLoadingCache(true)
        controller = new AbortController()
        Promise.all([
          fetchCollectorsByDrops(eventIds, controller.signal),
          fetchDropsMetrics(eventIds, controller.signal),
        ]).then(([eventsOwners, eventsMetrics]) => {
          updateEventsOwners(
            fillNull(
              eventsOwners,
              eventIds.map((eventId) => String(eventId)),
              []
            )
          )
          updateEventsMetrics(eventsMetrics)
          setLoadingCache(false)
          setCompleted(true)
        }).catch((err: unknown) => {
          setLoadingCache(false)
          if (err instanceof AbortedError) {
            setCompleted(true)
          } else {
            console.error(err)
            let promise = new Promise((r) => { r(undefined) })
            for (const eventId of eventIds) {
              promise = promise.then(() => force
                ? loadOwnersAndMetrics(eventId, controllers[eventId].signal)
                : loadCachedOwnersAndMetrics(eventId, controllers[eventId].signal))
            }
            promise.finally(() => {
              setCompleted(true)
            })
          }
        })
      }
      return () => {
        if (controller) {
          controller.abort()
        }
        for (const controller of Object.values(controllers)) {
          controller.abort()
        }
        setCompleted(false)
        setLoading({})
        setErrors({})
        setOwners({})
        setMetrics({})
      }
    },
    [
      eventIds,
      force,
      loadCachedOwnersAndMetrics,
      loadOwnersAndMetrics,
    ]
  )

  function retryEventOwnersAndMetrics(eventId: number): () => void {
    removeError(eventId)
    const controller = new AbortController()
    loadCachedOwnersAndMetrics(eventId, controller.signal)
    return () => {
      controller.abort()
    }
  }

  return {
    completedEventsOwnersAndMetrics: completed,
    loadingEventsOwnersAndMetrics: loadingCache,
    loadingOwnersAndMetricsEvents: loading,
    eventsOwnersAndMetricsErrors: errors,
    eventsOwners: owners,
    eventsMetrics: metrics,
    fetchEventsOwnersAndMetrics,
    retryEventOwnersAndMetrics,
  }
}

export default useEventsOwnersAndMetrics
