import { useCallback, useEffect, useState } from 'react'
import { AbortedError } from 'models/error'
import { Drop } from 'models/drop'
import { CountProgress, DownloadProgress } from 'models/http'
import { InCommon, filterInCommon } from 'models/in-common'
import { getInCommonEventsWithEvents, getInCommonEventsWithProgress } from 'loaders/api'
import { fetchCollectorDrops } from 'loaders/collector'

function useEventInCommon(
  dropId: number,
  collectors: string[],
  force: boolean = false,
  local: boolean = false,
  stream: boolean = false,
): {
  completedEventInCommon: boolean
  loadingEventInCommon: boolean
  loadedInCommonState: 'eventIds-a' | 'eventIds-z' | 'owners-a' | 'owners-z' | 'events-a' | 'events-z' | null
  loadedInCommon: CountProgress & { totalFinal: boolean } | null
  loadedInCommonDrops: CountProgress | null
  loadedInCommonDownload: DownloadProgress | null
  loadedCollectors: number
  collectorsErrors: Array<{ address: string; error: Error }>
  inCommon: InCommon
  drops: Record<number, Drop>
  cachedTs: number | null
  fetchDropInCommon: () => () => void
  retryAddress: (address: string) => void
} {
  const [completed, setCompleted] = useState<boolean>(false)
  const [loading, setLoading] = useState<boolean>(false)
  const [loadedInCommonState, setLoadedInCommonState] = useState<'eventIds-a' | 'eventIds-z' | 'owners-a' | 'owners-z' | 'events-a' | 'events-z' | null>(null)
  const [loadedInCommon, setLoadedInCommon] = useState<CountProgress & { totalFinal: boolean } | null>(null)
  const [loadedInCommonDrops, setLoadedInCommonDrops] = useState<CountProgress | null>(null)
  const [loadedProgress, setLoadedProgress] = useState<DownloadProgress | null>(null)
  const [loadedCollectors, setLoadedCollectors] = useState<number>(0)
  const [errors, setErrors] = useState<Array<{ address: string; error: Error }>>([])
  const [inCommon, setInCommon] = useState<InCommon>({})
  const [drops, setDrops] = useState<Record<number, Drop>>({})
  const [cachedTs, setCachedTs] = useState<number | null>(null)

  useEffect(
    () => {
      if (loadedCollectors === collectors.length && !cachedTs) {
        const inCommonProcessed = filterInCommon(inCommon)

        if (Object.keys(inCommonProcessed).length > 0) {
          setCachedTs(Math.trunc(Date.now() / 1000))
        }
      }
    },
    [dropId, collectors, loadedCollectors, cachedTs, inCommon]
  )

  function addError(address: string, err: unknown): void {
    if (err instanceof AbortedError) {
      return
    }
    const error = err instanceof Error ? err : new Error(
      'Cannot fetch address in common drops',
      { cause: err }
    )
    setErrors((prevErrors) => [...prevErrors, { address, error }])
  }

  function removeError(address: string): void {
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
  }

  const fetchAddressInCommon = useCallback(
    async (address: string, abortSignal: AbortSignal) => {
      let addressDrops: Drop[]
      try {
        addressDrops = await fetchCollectorDrops(address, abortSignal)
      } catch (err: unknown) {
        addError(address, err)
        return
      }
      for (const addressDrop of addressDrops) {
        const addressDropId = addressDrop.id
        setInCommon((prevInCommon) => {
          if (prevInCommon == null) {
            return {
              [addressDropId]: [address],
            }
          }
          if (addressDropId in prevInCommon) {
            if (!prevInCommon[addressDropId].includes(address)) {
              prevInCommon[addressDropId].push(address)
            }
          } else {
            prevInCommon[addressDropId] = [address]
          }
          return prevInCommon
        })
        setDrops((prevDrops) => ({
          ...prevDrops,
          [addressDropId]: addressDrop,
        }))
      }
      setLoadedCollectors((prevLoadedCount) => prevLoadedCount + 1)
    },
    []
  )

  const fetchCollectorsInCommon = useCallback(
    async (controllers: Record<string, AbortController>) => {
      setLoading(true)
      setLoadedCollectors(0)
      setErrors([])
      let promise = new Promise((r) => { r(undefined) })
      for (const owner of collectors) {
        promise = promise.then(
          () => fetchAddressInCommon(owner, controllers[owner].signal)
        )
      }
      await promise
      setLoading(false)
    },
    [collectors, fetchAddressInCommon]
  )

  const fetchDropInCommon = useCallback(
    () => {
      const controller = new AbortController()
      const controllers: Record<string, AbortController> = collectors.reduce(
        (ctrls, owner) => ({ ...ctrls, [owner]: new AbortController() }),
        {}
      )
      setCompleted(false)
      if (local) {
        fetchCollectorsInCommon(controllers).finally(() => {
          setCompleted(true)
        })
      } else {
        setLoading(true)
        setLoadedCollectors(0)
        setLoadedInCommon(null)
        setLoadedProgress(null)
        setLoadedInCommonState(null)
        ;(
          stream
            ? getInCommonEventsWithEvents(
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
                    setLoadedInCommonState(
                      (prevState) => prevState == null ? 'eventIds-a' : prevState
                    )
                    setLoadedInCommon({
                      count: receivedOwners ?? 0,
                      total: receivedEventIds,
                      totalFinal: receivedEventIds === totalInCommon,
                    })
                    if (receivedEventIds === totalInCommon) {
                      setLoadedInCommonState(
                        (prevState) => prevState === 'eventIds-a' ? 'eventIds-z' : prevState
                      )
                    }
                  }
                  if (receivedOwners) {
                    setLoadedInCommonState(
                      (prevState) => prevState === 'eventIds-z' ? 'owners-a' : prevState
                    )
                    if (receivedOwners === receivedEventIds) {
                      setLoadedInCommonState(
                        (prevState) => prevState === 'owners-a' ? 'owners-z' : prevState
                      )
                    }
                  }
                  if (totalEvents) {
                    setLoadedInCommonState(
                      (prevState) => prevState === 'owners-z' ? 'events-a' : prevState
                    )
                    setLoadedInCommonDrops({
                      count: receivedEvents ?? 0,
                      total: totalEvents,
                    })
                    if (receivedEvents === totalEvents) {
                      setLoadedInCommonState(
                        (prevState) => prevState === 'events-a' ? 'events-z' : prevState
                      )
                    }
                  }
                },
              )
            : getInCommonEventsWithProgress(
                dropId,
                /*abortSignal*/controller.signal,
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
                },
                /*refresh*/force
              )
        ).then(
          (result) => {
            setLoadedInCommonState(null)
            setLoadedInCommon(null)
            setLoadedProgress(null)
            if (!result) {
              return fetchCollectorsInCommon(controllers)
            }
            setLoading(false)
            if (dropId in result.inCommon) {
              setLoadedCollectors(result.inCommon[dropId].length)
            }
            setInCommon(result.inCommon)
            setDrops(result.events)
            setCachedTs(result.ts)
          },
          (err) => {
            setLoadedInCommon(null)
            setLoadedProgress(null)
            console.error(err)
            return fetchCollectorsInCommon(controllers)
          }
        ).finally(() => {
          setCompleted(true)
        })
      }
      return () => {
        controller.abort()
        for (const controller of Object.values(controllers)) {
          controller.abort()
        }
        setCompleted(false)
        setLoading(false)
        setLoadedInCommon(null)
        setLoadedProgress(null)
        setLoadedInCommonState(null)
        setLoadedCollectors(0)
        setErrors([])
        setInCommon({})
      }
    },
    [dropId, collectors, force, local, stream, fetchCollectorsInCommon]
  )

  function retryAddress(address: string): () => void {
    removeError(address)
    const controller = new AbortController()
    fetchAddressInCommon(address, controller.signal).catch((err) => {
      addError(address, err)
    })
    return () => {
      controller.abort()
    }
  }

  return {
    completedEventInCommon: completed,
    loadingEventInCommon: loading,
    loadedInCommonState,
    loadedInCommon,
    loadedInCommonDrops: loadedInCommonDrops,
    loadedInCommonDownload: loadedProgress,
    loadedCollectors,
    collectorsErrors: errors,
    inCommon,
    drops: drops,
    cachedTs,
    fetchDropInCommon,
    retryAddress,
  }
}

export default useEventInCommon
