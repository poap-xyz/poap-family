import { useCallback, useEffect, useState } from 'react'
import { AbortedError } from 'models/error'
import { filterInCommon } from 'models/in-common'
import { Drop } from 'models/drop'
import { POAP } from 'models/poap'
import { Progress } from 'models/http'
import { InCommon } from 'models/api'
import { getInCommonEventsWithProgress, putEventInCommon } from 'loaders/api'
import { scanAddress } from 'loaders/poap'

function useEventInCommon(eventId: number, owners: string[], force: boolean = false): {
  completedEventInCommon: boolean
  loadingEventInCommon: boolean
  loadedInCommonProgress: { progress: number; estimated: number | null; rate: number | null } | null
  loadedOwners: number
  ownersErrors: Array<{ address: string; error: Error }>
  inCommon: InCommon
  events: Record<number, Drop>
  caching: boolean
  cachingError: Error | null
  cachedTs: number | null
  fetchEventInCommon: () => () => void
  retryAddress: (address: string) => void
} {
  const [completed, setCompleted] = useState<boolean>(false)
  const [loading, setLoading] = useState<boolean>(false)
  const [loadedProgress, setLoadedProgress] = useState<Progress | null>(null)
  const [loadedOwners, setLoadedOwners] = useState<number>(0)
  const [errors, setErrors] = useState<Array<{ address: string; error: Error }>>([])
  const [inCommon, setInCommon] = useState<InCommon>({})
  const [events, setEvents] = useState<Record<number, Drop>>({})
  const [caching, setCaching] = useState<boolean>(false)
  const [cachingError, setCachingError] = useState<Error | null>(null)
  const [cachedTs, setCachedTs] = useState<number | null>(null)

  useEffect(
    () => {
      if (loadedOwners === owners.length && !cachedTs) {
        const inCommonProcessed = filterInCommon(inCommon)

        if (Object.keys(inCommonProcessed).length > 0) {
          setCaching(true)
          setCachingError(null)
          putEventInCommon(eventId, inCommonProcessed).then(
            () => {
              setCaching(false)
              setCachedTs(Math.trunc(Date.now() / 1000))
            },
            (err) => {
              console.error(err)
              setCaching(false)
              setCachingError(new Error(
                'Could not cache drop',
                { cause: err }
              ))
            }
          )
        }
      }
    },
    [eventId, owners, loadedOwners, cachedTs, inCommon]
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

  const fetchAddressInCommon = useCallback(
    async (address: string, abortSignal: AbortSignal) => {
      let tokens: POAP[]
      try {
        tokens = await scanAddress(address, abortSignal)
      } catch (err) {
        addError(address, err)
        return
      }
      for (const token of tokens) {
        const event = token.event
        if (event != null) {
          const eventId = event.id
          setInCommon((prevInCommon) => {
            if (prevInCommon == null) {
              return {
                [eventId]: [address],
              }
            }
            if (eventId in prevInCommon) {
              if (!prevInCommon[eventId].includes(address)) {
                prevInCommon[eventId].push(address)
              }
            } else {
              prevInCommon[eventId] = [address]
            }
            return prevInCommon
          })
          setEvents((prevEvents) => ({ ...prevEvents, [eventId]: event }))
        } else {
          const error = new Error(`Could not find POAP ${token.id}`)
          addError(address, error)
          return
        }
      }
      setLoadedOwners((prevLoadedCount) => prevLoadedCount + 1)
    },
    []
  )

  const fetchOwnersInCommon = useCallback(
    async (controllers: Record<string, AbortController>) => {
      setLoading(true)
      setLoadedOwners(0)
      setErrors([])
      let promise = new Promise((r) => { r(undefined) })
      for (const owner of owners) {
        promise = promise.then(
          () => fetchAddressInCommon(owner, controllers[owner].signal)
        )
      }
      await promise
      setLoading(false)
    },
    [owners, fetchAddressInCommon]
  )

  const fetchEventInCommon = useCallback(
    () => {
      const controllers: Record<string, AbortController> = owners.reduce(
        (ctrls, owner) => ({ ...ctrls, [owner]: new AbortController() }),
        {}
      )
      setCompleted(false)
      if (force) {
        fetchOwnersInCommon(controllers).finally(() => {
          setCompleted(true)
        })
      } else {
        setLoading(true)
        setLoadedOwners(0)
        setLoadedProgress(null)
        getInCommonEventsWithProgress(
          eventId,
          /*abortSignal*/undefined,
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
          }
        ).then(
          (result) => {
            setLoadedProgress(null)
            if (!result) {
              return fetchOwnersInCommon(controllers)
            }
            setLoading(false)
            if (eventId in result.inCommon) {
              setLoadedOwners(result.inCommon[eventId].length)
            }
            setInCommon(result.inCommon)
            setEvents(result.events)
            setCachedTs(result.ts)
          },
          (err) => {
            setLoadedProgress(null)
            console.error(err)
            return fetchOwnersInCommon(controllers)
          }
        ).finally(() => {
          setCompleted(true)
        })
      }
      return () => {
        for (const controller of Object.values(controllers)) {
          controller.abort()
        }
        setCompleted(false)
        setLoading(false)
        setLoadedProgress(null)
        setLoadedOwners(0)
        setErrors([])
        setInCommon({})
      }
    },
    [eventId, owners, force, fetchOwnersInCommon]
  )

  function retryAddress(address: string): () => void {
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
    const controller = new AbortController()
    fetchAddressInCommon(address, controller.signal)
    return () => {
      controller.abort()
    }
  }

  return {
    completedEventInCommon: completed,
    loadingEventInCommon: loading,
    loadedInCommonProgress: loadedProgress,
    loadedOwners,
    ownersErrors: errors,
    inCommon,
    events,
    caching,
    cachingError,
    cachedTs,
    fetchEventInCommon,
    retryAddress,
  }
}

export default useEventInCommon
