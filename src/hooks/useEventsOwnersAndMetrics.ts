import { useCallback, useState } from 'react'
import { filterInvalidAddresses } from 'models/address'
import { InCommon } from 'models/in-common'
import { DropMetrics } from 'models/drop'
import { AbortedError } from 'models/error'
import { fetchCollectorsByDrops, fetchDropsCollectors } from 'loaders/collector'
import { fetchDropMetrics, fetchDropsMetrics } from 'loaders/drop'
import { fillNull } from 'utils/object'

function useEventsOwnersAndMetrics(dropIds: number[]): {
  completedDropsCollectorsAndMetrics: boolean
  loadingDropsCollectorsAndMetrics: boolean
  loadingCollectorsAndMetricsDrops: Record<number, boolean>
  dropsCollectorsAndMetricsErrors: Record<number, Error>
  dropsCollectors: InCommon
  dropsMetrics: Record<number, DropMetrics>
  fetchDropsCollectorsAndMetrics: () => () => void
  retryDropCollectorsAndMetrics: (dropId: number) => () => void
} {
  const [completed, setCompleted] = useState<boolean>(false)
  const [loadingCache, setLoadingCache] = useState<boolean>(false)
  const [loading, setLoading] = useState<Record<number, boolean>>({})
  const [errors, setErrors] = useState<Record<number, Error>>({})
  const [collectors, setCollectors] = useState<InCommon>({})
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

  function updateEventCollectors(dropId: number, collectors: string[]): void {
    setCollectors((prevCollectors) => ({
      ...prevCollectors,
      [dropId]: filterInvalidAddresses(collectors),
    }))
  }

  function updateDropsCollectors(dropsCollectors: InCommon): void {
    setCollectors((prevCollectors) => ({
      ...prevCollectors,
      ...Object.fromEntries(
        Object.entries(dropsCollectors)
          .filter(([, dropCollectors]) => dropCollectors != null)
          .map(
            ([rawDropId, collectors]) => [
              rawDropId,
              filterInvalidAddresses(collectors),
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

  const loadCollectorsAndMetrics = useCallback(
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
        updateEventCollectors(
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

  const fetchDropsCollectorsAndMetrics = useCallback(
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
      setCollectors({})
      setMetrics({})
      setLoadingCache(true)
      controller = new AbortController()
      Promise.all([
        fetchCollectorsByDrops(dropIds, controller.signal),
        fetchDropsMetrics(dropIds, controller.signal),
      ]).then(([dropsCollectors, dropsMetrics]) => {
        updateDropsCollectors(
          fillNull(
            dropsCollectors,
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
              loadCollectorsAndMetrics(dropId, controllers[dropId].signal))
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
        setCollectors({})
        setMetrics({})
      }
    },
    [
      dropIds,
      loadCollectorsAndMetrics,
    ]
  )

  function retryDropCollectorsAndMetrics(dropId: number): () => void {
    removeError(dropId)
    const controller = new AbortController()
    loadCollectorsAndMetrics(dropId, controller.signal)
    return () => {
      controller.abort()
    }
  }

  return {
    completedDropsCollectorsAndMetrics: completed,
    loadingDropsCollectorsAndMetrics: loadingCache,
    loadingCollectorsAndMetricsDrops: loading,
    dropsCollectorsAndMetricsErrors: errors,
    dropsCollectors: collectors,
    dropsMetrics: metrics,
    fetchDropsCollectorsAndMetrics,
    retryDropCollectorsAndMetrics,
  }
}

export default useEventsOwnersAndMetrics
