import { useCallback, useState } from 'react'
import { filterInvalidOwners } from 'models/address'
import { AbortedError } from 'models/error'
import { InCommon } from 'models/api'
import { fetchPOAPs } from 'loaders/poap'
import {
  getEventAndOwners,
  getEventMetrics,
  getEventsMetrics,
  getEventsOwners,
} from 'loaders/api'

function useEventsOwnersAndMetrics(eventIds: number[], expiryDates: Record<number, Date>, force: boolean = false): {
  completedEventsOwnersAndMetrics: boolean
  loadingEventsOwnersAndMetrics: boolean
  loadingOwnersAndMetricsEvents: Record<number, boolean>
  eventsOwnersAndMetricsErrors: Record<number, Error>
  eventsOwners: InCommon
  eventsMetrics: Record<number, { emailReservations: number; emailClaimsMinted: number; emailClaims: number; momentsUploaded: number; collectionsIncludes: number; ts: number }>
  fetchEventsOwnersAndMetrics: () => () => void
  retryEventOwnersAndMetrics: (eventId: number) => () => void
} {
  const [completed, setCompleted] = useState<boolean>(false)
  const [loadingCache, setLoadingCache] = useState<boolean>(false)
  const [loading, setLoading] = useState<Record<number, boolean>>({})
  const [errors, setErrors] = useState<Record<number, Error>>({})
  const [owners, setOwners] = useState<InCommon>({})
  const [metrics, setMetrics] = useState<Record<number, { emailReservations: number; emailClaimsMinted: number; emailClaims: number; momentsUploaded: number; collectionsIncludes: number; ts: number }>>({})

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

  function updateEventsOwners(eventsOwners: InCommon): void {
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

  function updateEventMetrics(eventId: number, metrics: { emailReservations: number; emailClaimsMinted: number; emailClaims: number; momentsUploaded: number; collectionsIncludes: number; ts: number }): void {
    if (metrics == null) {
      return
    }
    setMetrics((prevMetrics) => ({
      ...prevMetrics,
      [eventId]: metrics,
    }))
  }

  function updateEventsMetrics(eventsMetrics: Record<number, { emailReservations: number; emailClaimsMinted: number; emailClaims: number; momentsUploaded: number; collectionsIncludes: number; ts: number }>): void {
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
      let eventAndOwners
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
      let eventOwnerTokensResult
      let eventMetricsResult
      try {
        [eventOwnerTokensResult, eventMetricsResult] = await Promise.allSettled([
          fetchPOAPs(eventId, abortSignal),
          getEventMetrics(eventId, abortSignal, force),
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
      if (eventOwnerTokensResult.status === 'fulfilled') {
        updateEventOwners(
          eventId,
          eventOwnerTokensResult.value.map((token) => token.owner)
        )
      } else {
        if (!(eventOwnerTokensResult.reason instanceof AbortedError)) {
          console.error(eventOwnerTokensResult.reason)
          addError(
            eventId,
            new Error(`Tokens for drop '${eventId}' failed to fetch`, {
              cause: eventOwnerTokensResult.reason,
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
    [force]
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
          getEventsOwners(eventIds, controller.signal, expiryDates),
          getEventsMetrics(eventIds, controller.signal, expiryDates),
        ]).then(([eventsOwners, eventsMetrics]) => {
          updateEventsOwners(
            Object.fromEntries(
              Object.entries(eventsOwners).map(
                ([rawEventId, eventOwners]) => [
                  rawEventId,
                  eventOwners.owners,
                ]
              )
            )
          )
          updateEventsMetrics(eventsMetrics)
          setLoadingCache(false)
          setCompleted(true)
        }).catch((err) => {
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
      expiryDates,
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
