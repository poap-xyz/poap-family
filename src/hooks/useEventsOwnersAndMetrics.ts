import { useCallback, useState } from 'react'
import { filterInvalidOwners } from 'models/address'
import { DropMetrics } from 'models/drop'
import { AbortedError } from 'models/error'
import { fetchCollectorsByDrops, fetchDropsCollectors } from 'loaders/collector'
import { fetchDropMetrics, fetchDropsMetrics } from 'loaders/drop'
import { fillNull } from 'utils/object'

function useEventsOwnersAndMetrics(dropIds: number[]): {
  completedDropsOwnersAndMetrics: boolean
  loadingDropsOwnersAndMetrics: boolean
  loadingOwnersAndMetricsDrops: Record<number, boolean>
  dropsOwnersAndMetricsErrors: Record<number, Error>
  dropsOwners: Record<number, string[]>
  dropsMetrics: Record<number, DropMetrics>
  fetchDropsOwnersAndMetrics: () => () => void
  retryEventOwnersAndMetrics: (dropId: number) => () => void
} {
  const [completed, setCompleted] = useState<boolean>(false)
  const [loadingCache, setLoadingCache] = useState<boolean>(false)
  const [loading, setLoading] = useState<Record<number, boolean>>({})
  const [errors, setErrors] = useState<Record<number, Error>>({})
  const [owners, setOwners] = useState<Record<number, string[]>>({})
  const [metrics, setMetrics] = useState<Record<number, DropMetrics>>({})

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

  function addError(dropId: number, err: Error): void {
    setErrors((prevErrors) => ({
      ...prevErrors,
      [dropId]: err,
    }))
  }

  function removeError(dropId: number): void {
    setErrors((alsoErrors) => {
      if (alsoErrors == null) {
        return {}
      }
      const newErrors: Record<number, Error> = {}
      for (const [errorEventId, error] of Object.entries(alsoErrors)) {
        if (String(dropId) !== String(errorEventId)) {
          newErrors[errorEventId] = error
        }
      }
      return newErrors
    })
  }

  function updateEventOwners(dropId: number, owners: string[]): void {
    setOwners((prevOwners) => ({
      ...prevOwners,
      [dropId]: filterInvalidOwners(owners),
    }))
  }

  function updateDropsOwners(dropsOwners: Record<number, string[]>): void {
    setOwners((prevOwners) => ({
      ...prevOwners,
      ...Object.fromEntries(
        Object.entries(dropsOwners)
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

  function updateEventMetrics(dropId: number, metrics: DropMetrics): void {
    if (metrics == null) {
      return
    }
    setMetrics((prevMetrics) => ({
      ...prevMetrics,
      [dropId]: metrics,
    }))
  }

  function updateDropsMetrics(dropsMetrics: Record<number, DropMetrics>): void {
    setMetrics((prevMetrics) => ({
      ...prevMetrics,
      ...Object.fromEntries(
        Object.entries(dropsMetrics).filter(([, metrics]) => metrics != null)
      ),
    }))
  }

  const loadOwnersAndMetrics = useCallback(
    async (dropId: number, abortSignal: AbortSignal) => {
      removeError(dropId)
      addLoading(dropId)
      let eventCollectorsResult: PromiseSettledResult<Awaited<ReturnType<typeof fetchDropsCollectors>>>
      let eventMetricsResult: PromiseSettledResult<Awaited<ReturnType<typeof fetchDropMetrics>>>
      try {
        [eventCollectorsResult, eventMetricsResult] = await Promise.allSettled([
          fetchDropsCollectors([dropId], abortSignal),
          fetchDropMetrics(dropId, abortSignal),
        ])
      } catch (err: unknown) {
        removeLoading(dropId)
        if (!(err instanceof AbortedError)) {
          addError(
            dropId,
            new Error('Could not fetch collectors or metrics', {
              cause: err,
            })
          )
        }
        return
      }
      removeLoading(dropId)
      if (eventCollectorsResult.status === 'fulfilled') {
        updateEventOwners(
          dropId,
          eventCollectorsResult.value
        )
      } else {
        if (!(eventCollectorsResult.reason instanceof AbortedError)) {
          console.error(eventCollectorsResult.reason)
          addError(
            dropId,
            new Error(`Collectors for drop '${dropId}' failed to fetch`, {
              cause: eventCollectorsResult.reason,
            })
          )
        }
      }
      if (eventMetricsResult.status === 'fulfilled') {
        if (eventMetricsResult.value) {
          updateEventMetrics(dropId, eventMetricsResult.value)
        }
      } else {
        if (!(eventMetricsResult.reason instanceof AbortedError)) {
          console.error(eventMetricsResult.reason)
        }
      }
    },
    []
  )

  const fetchDropsOwnersAndMetrics = useCallback(
    () => {
      let controller: AbortController | undefined
      const controllers: Record<number, AbortController> = dropIds.reduce(
        (ctrls, dropId) => ({
          ...ctrls,
          [dropId]: new AbortController(),
        }),
        {}
      )
      setCompleted(false)
      setLoadingCache(false)
      setLoading({})
      setErrors({})
      setOwners({})
      setMetrics({})
      setLoadingCache(true)
      controller = new AbortController()
      Promise.all([
        fetchCollectorsByDrops(dropIds, controller.signal),
        fetchDropsMetrics(dropIds, controller.signal),
      ]).then(([dropsOwners, dropsMetrics]) => {
        updateDropsOwners(
          fillNull(
            dropsOwners,
            dropIds.map((dropId) => String(dropId)),
            []
          )
        )
        updateDropsMetrics(dropsMetrics)
        setLoadingCache(false)
        setCompleted(true)
      }).catch((err: unknown) => {
        setLoadingCache(false)
        if (err instanceof AbortedError) {
          setCompleted(true)
        } else {
          console.error(err)
          let promise = new Promise((r) => { r(undefined) })
          for (const dropId of dropIds) {
            promise = promise.then(() =>
              loadOwnersAndMetrics(dropId, controllers[dropId].signal))
          }
          promise.finally(() => {
            setCompleted(true)
          })
        }
      })
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
      dropIds,
      loadOwnersAndMetrics,
    ]
  )

  function retryEventOwnersAndMetrics(dropId: number): () => void {
    removeError(dropId)
    const controller = new AbortController()
    loadOwnersAndMetrics(dropId, controller.signal)
    return () => {
      controller.abort()
    }
  }

  return {
    completedDropsOwnersAndMetrics: completed,
    loadingDropsOwnersAndMetrics: loadingCache,
    loadingOwnersAndMetricsDrops: loading,
    dropsOwnersAndMetricsErrors: errors,
    dropsOwners: owners,
    dropsMetrics: metrics,
    fetchDropsOwnersAndMetrics: fetchDropsOwnersAndMetrics,
    retryEventOwnersAndMetrics,
  }
}

export default useEventsOwnersAndMetrics
