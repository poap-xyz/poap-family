import { useCallback, useState } from 'react'
import { InCommon } from 'models/in-common'
import { filterInvalidAddresses } from 'models/address'
import { AbortedError } from 'models/error'
import { fillNull } from 'utils/object'
import {
  fetchCollectorsByDrops,
  fetchDropsCollectors as fetchCollectors,
} from 'services/collectors'

function useDropsCollectors(dropIds?: number[]): {
  completed: boolean
  loading: boolean
  loadingDrops: Record<number, boolean>
  errors: Record<number, Error>
  dropsCollectors: InCommon
  fetchDropsCollectors: () => () => void
  retryDropCollectors: (dropId: number) => () => void
} {
  const [completed, setCompleted] = useState<boolean>(false)
  const [loading, setLoading] = useState<boolean>(false)
  const [loadingDrops, setLoadingDrops] = useState<Record<number, boolean>>({})
  const [errors, setErrors] = useState<Record<number, Error>>({})
  const [dropsCollectors, setDropsCollectors] = useState<InCommon>({})

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

  function updateDropCollectors(dropId: number, collectors: string[]): void {
    setDropsCollectors((prevCollectors) => ({
      ...prevCollectors,
      [dropId]: filterInvalidAddresses(collectors),
    }))
  }

  function updateDropsCollectors(dropsCollectors: InCommon): void {
    setDropsCollectors((prevCollectors) => ({
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

  const fetchDropCollectors = useCallback(
    async (dropId: number, abortSignal: AbortSignal) => {
      removeError(dropId)
      addLoading(dropId)
      let dropCollectors: string[]
      try {
        dropCollectors = await fetchCollectors([dropId], abortSignal)
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
      updateDropCollectors(dropId, dropCollectors)
    },
    []
  )

  const fetchDropsCollectors = useCallback(
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
      setDropsCollectors({})
      controller = new AbortController()
      fetchCollectorsByDrops(dropIds, controller.signal).then((dropsCollectors) => {
        updateDropsCollectors(
          fillNull(
            dropsCollectors,
            dropIds.map((dropId) => String(dropId)),
            []
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
              fetchDropCollectors(dropId, controllers[dropId].signal))
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
        setDropsCollectors({})
      }
    },
    [
      dropIds,
      fetchDropCollectors,
    ]
  )

  function retryDropCollectors(dropId: number): () => void {
    if (!dropIds.includes(dropId)) {
      return
    }
    removeError(dropId)
    const controller = new AbortController()
    fetchDropCollectors(dropId, controller.signal)
    return () => {
      controller.abort()
    }
  }

  return {
    completed,
    loading,
    loadingDrops,
    errors,
    dropsCollectors,
    fetchDropsCollectors,
    retryDropCollectors,
  }
}

export default useDropsCollectors
