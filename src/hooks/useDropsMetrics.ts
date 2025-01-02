import { useCallback, useState } from 'react'
import { DropMetrics } from 'models/drop'
import { AbortedError } from 'models/error'
import { fillNull } from 'utils/object'
import {
  fetchDropMetrics as fetchMetricsOne,
  fetchDropsMetrics as fetchMetricsMany,
} from 'services/drops'

function useDropsMetrics(dropIds?: number[]): {
  completed: boolean
  loading: boolean
  loadingDrops: Record<number, boolean>
  errors: Record<number, Error>
  dropsMetrics: Record<number, DropMetrics>
  fetchDropsMetrics: () => () => void
  retryDropMetrics: (dropId: number) => () => void
} {
  const [completed, setCompleted] = useState<boolean>(false)
  const [loading, setLoading] = useState<boolean>(false)
  const [loadingDrops, setLoadingDrops] = useState<Record<number, boolean>>({})
  const [errors, setErrors] = useState<Record<number, Error>>({})
  const [dropsMetrics, setDropsMetrics] = useState<Record<number, DropMetrics>>({})

  function addLoading(dropId: number): void {
    setLoadingDrops((alsoLoading) => ({
      ...alsoLoading,
      [dropId]: true,
    }))
  }

  function removeLoading(dropId: number): void {
    setLoadingDrops((alsoLoading) => {
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

  function updateDropMetrics(dropId: number, metrics: DropMetrics): void {
    if (metrics == null) {
      return
    }
    setDropsMetrics((prevDropsMetrics) => ({
      ...prevDropsMetrics,
      [dropId]: metrics,
    }))
  }

  function updateDropsMetrics(dropsMetrics: Record<number, DropMetrics>): void {
    setDropsMetrics((prevDropsMetrics) => ({
      ...prevDropsMetrics,
      ...Object.fromEntries(
        Object.entries(dropsMetrics).filter(([, metrics]) => metrics != null)
      ),
    }))
  }

  const fetchDropMetrics = useCallback(
    async (dropId: number, abortSignal: AbortSignal) => {
      removeError(dropId)
      addLoading(dropId)
      let dropMetrics: DropMetrics
      try {
        dropMetrics = await fetchMetricsOne(dropId, abortSignal)
      } catch (err: unknown) {
        removeLoading(dropId)
        if (!(err instanceof AbortedError)) {
          console.error(err)
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
      updateDropMetrics(dropId, dropMetrics)
    },
    []
  )

  const fetchDropsMetrics = useCallback(
    () => {
      if (dropIds == null) {
        return () => {}
      }
      let controller: AbortController | undefined
      const controllers: Record<number, AbortController> = dropIds.reduce(
        (ctrls, dropId) => ({
          ...ctrls,
          [dropId]: new AbortController(),
        }),
        {}
      )
      setCompleted(false)
      setLoading(true)
      setLoadingDrops({})
      setErrors({})
      setDropsMetrics({})
      controller = new AbortController()
      fetchMetricsMany(dropIds, controller.signal).then((dropsCollectors) => {
        updateDropsMetrics(
          fillNull(
            dropsCollectors,
            dropIds.map((dropId) => String(dropId)),
            {
              emailReservations: 0,
              emailClaims: 0,
              emailClaimsMinted: 0,
              momentsUploaded: 0,
              collectionsIncludes: 0,
            }
          )
        )
        setCompleted(true)
        setLoading(false)
      }).catch((err: unknown) => {
        if (err instanceof AbortedError) {
          setCompleted(true)
        } else {
          console.error(err)
          let promise = new Promise((r) => { r(undefined) })
          for (const dropId of dropIds) {
            promise = promise.then(() =>
              fetchDropMetrics(dropId, controllers[dropId].signal))
          }
          promise.finally(() => {
            setCompleted(true)
            setLoading(false)
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
        setLoading(false)
        setLoadingDrops({})
        setErrors({})
        setDropsMetrics({})
      }
    },
    [
      dropIds,
      fetchDropMetrics,
    ]
  )

  function retryDropMetrics(dropId: number): () => void {
    if (!dropIds.includes(dropId)) {
      return
    }
    removeError(dropId)
    const controller = new AbortController()
    fetchDropMetrics(dropId, controller.signal)
    return () => {
      controller.abort()
    }
  }

  return {
    completed,
    loading,
    loadingDrops,
    errors,
    dropsMetrics,
    fetchDropsMetrics,
    retryDropMetrics,
  }
}

export default useDropsMetrics
